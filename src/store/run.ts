import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { fmt } from '../lib/format';
import i18n from '../i18n';
import { createRng, normalizedSeedFrom, shuffleInPlace } from '../lib/rng';
import { getRewardCard } from '../data/cards';
import { generateStages } from '../data/stages';
import { getShopItem } from '../data/shopItems';
import { useMetaStore } from './meta';
import {
  getSkillAggregates,
  syncSkillRunModifiers,
  useSkillsStore,
} from './skills';
import type {
  FloatingText,
  RewardCardId,
  RunState,
  RunSummary,
  Stage,
} from './types';

type RunStore = {
  run: RunState | null;
  rewardChoices: RewardCardId[];
  rewardStageIndex: number | null;
  showReward: boolean;
  bossOpen: boolean;
  pickedCards: RewardCardId[];
  showSummary: boolean;
  summary: RunSummary | null;
  floatingTexts: FloatingText[];
  shopLevels: Record<string, number>;
  newRun: (seed?: number) => void;
  tick: (dt: number) => void;
  click: () => number;
  clearStage: () => void;
  applyReward: (cardId: RewardCardId) => void;
  openBoss: () => void;
  hitBoss: () => number;
  closeBoss: () => void;
  finishRun: (kind: 'cleared' | 'abandon') => void;
  buyShopItem: (itemId: string) => void;
  resetUi: () => void;
  checkStageCompletion: () => void;
};

const FLOATING_TEXT_MAX = 8;
const DEFAULT_CLICK = 1;
const DEFAULT_HPS = 0;

export const useRunStore = create<RunStore>()(
  persist(
    (set, get) => ({
      run: null,
      rewardChoices: [],
      rewardStageIndex: null,
      showReward: false,
      bossOpen: false,
      pickedCards: [],
      showSummary: false,
      summary: null,
      floatingTexts: [],
      shopLevels: {},
      newRun: (seed) => {
        const nextSeed = seed ?? Date.now();
        const run = createRun(nextSeed);
        set({
          run,
          rewardChoices: [],
          rewardStageIndex: null,
          showReward: false,
          bossOpen: false,
          pickedCards: [],
          showSummary: false,
          summary: null,
          floatingTexts: [],
          shopLevels: {},
        });
        useSkillsStore.getState().resetAll();
        syncSkillRunModifiers(run.tempMods);
      },
      tick: (dt) => {
        const state = get();
        if (!state.run || !state.run.alive || state.showSummary) {
          return;
        }
        const now = Date.now();
        useSkillsStore.getState().tick(now);
        const aggregates = getSkillAggregates(now);
        const ppsMult = (state.run.tempMods.ppsMult ?? 1) * aggregates.ppsMult;
        const effectiveDt = dt * aggregates.tickRateFactor;
        const gain = state.run.pps * ppsMult * effectiveDt;
        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const run: RunState = {
            ...existingRun,
            happy: existingRun.happy + gain,
          };
          const floatingTexts = decayFloatingTexts(current.floatingTexts, dt);
          return {
            ...current,
            run,
            floatingTexts,
          };
        });
        get().checkStageCompletion();
      },
      click: () => {
        const state = get();
        if (!state.run || !state.run.alive || state.showSummary) {
          return 0;
        }
        const now = Date.now();
        useSkillsStore.getState().tick(now);
        const outcome = computeClickOutcome(state.run, { boss: false }, now);
        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const floatingTexts = appendFloatingText(
            decayFloatingTexts(current.floatingTexts, 0),
            outcome.gain,
            outcome.crit,
          );
          return {
            ...current,
            run: {
              ...existingRun,
              happy: existingRun.happy + outcome.gain,
              totalPets: existingRun.totalPets + 1,
            },
            floatingTexts,
          };
        });
        get().checkStageCompletion();
        return outcome.gain;
      },
      clearStage: () => {
        prepareRewardChoices();
      },
      applyReward: (cardId) => {
        const state = get();
        if (!state.run || state.rewardStageIndex === null || !state.showReward) {
          return;
        }

        const card = getRewardCard(cardId);
        let bonusHappy = 0;

        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const run: RunState = {
            ...existingRun,
            tempMods: card.apply({ ...existingRun.tempMods }),
          };

          if (card.id === 'lucky_cache') {
            const stage = existingRun.stageIndex < existingRun.stages.length
              ? existingRun.stages[existingRun.stageIndex]
              : null;
            const basis =
              stage?.goalHappy ??
              (stage?.boss?.rewardHappy ?? Math.max(run.happy, 300));
            bonusHappy = Math.floor(basis * 0.4);
            run.happy += bonusHappy;
          }

          return {
            ...current,
            run,
            showReward: false,
            rewardChoices: [],
            rewardStageIndex: null,
            pickedCards: [...current.pickedCards, cardId],
          };
        });

        const updatedRun = get().run;
        syncSkillRunModifiers(updatedRun?.tempMods);

        advanceStage();
        if (bonusHappy > 0) {
          // Ensure stage completion after bonus gain.
          get().checkStageCompletion();
        }
      },
      openBoss: () => {
        const { run } = get();
        if (!run || run.stageIndex >= run.stages.length) {
          return;
        }
        const stage = run.stages[run.stageIndex];
        if (stage.kind !== 'boss') {
          return;
        }
        set({ bossOpen: true });
      },
      hitBoss: () => {
        const state = get();
        if (!state.run || state.showSummary) {
          return 0;
        }
        const stage = state.run.stages[state.run.stageIndex];
        if (!stage || stage.kind !== 'boss' || !stage.boss) {
          return 0;
        }

        const now = Date.now();
        useSkillsStore.getState().tick(now);
        const outcome = computeClickOutcome(state.run, { boss: true }, now);
        let defeated = false;
        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const activeStage = existingRun.stages[existingRun.stageIndex];
          if (!activeStage || activeStage.kind !== 'boss' || !activeStage.boss) {
            return current;
          }
          const bossBefore = activeStage.boss.hp;
          const bossAfter = Math.max(0, bossBefore - outcome.gain);
          if (bossAfter === 0 && bossBefore > 0) {
            defeated = true;
          }
          const updatedBoss = {
            ...activeStage.boss,
            hp: bossAfter,
          };
          const stages: Stage[] = existingRun.stages.map((s, index) =>
            index === existingRun.stageIndex
              ? { ...s, boss: updatedBoss }
              : s,
          );

          const floatingTexts = appendFloatingText(
            decayFloatingTexts(current.floatingTexts, 0),
            outcome.gain,
            outcome.crit,
          );

          return {
            ...current,
            run: {
              ...existingRun,
              stages,
              happy:
                existingRun.happy +
                outcome.gain +
                (defeated ? activeStage.boss.rewardHappy : 0),
              totalPets: existingRun.totalPets + 1,
            },
            floatingTexts,
          };
        });

        if (defeated) {
          set({ bossOpen: false });
        }
        get().checkStageCompletion();
        return outcome.gain;
      },
      closeBoss: () => {
        set({ bossOpen: false });
      },
      finishRun: (kind) => {
        const state = get();
        if (!state.run) {
          return;
        }

        const cleared = kind === 'cleared';
        const stagesCleared = Math.min(state.run.stageIndex, state.run.stages.length);

        const summary: RunSummary = {
          runId: state.run.runId,
          seed: state.run.seed,
          cleared,
          stagesCleared,
          totalStages: state.run.stages.length,
          totalHappy: Math.floor(state.run.happy),
          startedAt: state.run.startedAt,
          cards: state.pickedCards,
        };

        set((current) => ({
          ...current,
          run: current.run
            ? {
                ...current.run,
                alive: false,
                cleared,
              }
            : current.run,
          showSummary: true,
          summary,
          bossOpen: false,
          showReward: false,
          rewardChoices: [],
          rewardStageIndex: null,
        }));

        useSkillsStore.getState().resetAll();
        syncSkillRunModifiers(undefined);

        const rewardSouls = Math.max(1, stagesCleared);
        useMetaStore.getState().addSouls(rewardSouls);
      },
      buyShopItem: (itemId) => {
        const state = get();
        if (!state.run || state.showSummary) {
          return;
        }
        const item = getShopItem(itemId);
        const level = state.shopLevels[itemId] ?? 0;
        const discount = clampLow(state.run.tempMods.shopDiscount ?? 1, 0.4);
        const price = Math.ceil(item.basePrice * Math.pow(item.growth, level) * discount);
        if (state.run.happy < price) {
          return;
        }

        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const updatedLevels = {
            ...current.shopLevels,
            [itemId]: level + 1,
          };
          const run: RunState = {
            ...existingRun,
            happy: existingRun.happy - price,
            clickPower:
              item.type === 'click'
                ? existingRun.clickPower + item.gain
                : existingRun.clickPower,
            pps:
              item.type === 'pps'
                ? existingRun.pps + item.gain
                : existingRun.pps,
          };
          return {
            ...current,
            run,
            shopLevels: updatedLevels,
          };
        });
      },
      resetUi: () => {
        set({
          bossOpen: false,
          showReward: false,
          rewardChoices: [],
          rewardStageIndex: null,
          floatingTexts: [],
        });
      },
      checkStageCompletion: () => {
        const state = get();
        const run = state.run;
        if (!run || !run.alive) {
          return;
        }
        if (state.showReward) {
          return;
        }
        if (run.stageIndex >= run.stages.length) {
          if (!run.cleared) {
            set((current) => ({
              ...current,
              run: current.run ? { ...current.run, cleared: true } : current.run,
            }));
            get().finishRun('cleared');
          }
          return;
        }

        const stage = run.stages[run.stageIndex];
        if (stage.kind === 'goal') {
          if ((stage.goalHappy ?? Number.POSITIVE_INFINITY) <= run.happy) {
            prepareRewardChoices();
          }
        } else if (stage.kind === 'boss' && stage.boss && stage.boss.hp <= 0) {
          prepareRewardChoices();
        }
      },
    }),
    {
      name: 'purrfect-run',
      partialize: (state) => ({
        run: state.run,
        rewardChoices: state.rewardChoices,
        rewardStageIndex: state.rewardStageIndex,
        showReward: state.showReward,
        pickedCards: state.pickedCards,
        showSummary: state.showSummary,
        summary: state.summary,
        shopLevels: state.shopLevels,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        state.bossOpen = false;
        state.floatingTexts = [];
        syncSkillRunModifiers(state.run?.tempMods);
      },
    },
  ),
);

function createRun(seed: number): RunState {
  return {
    runId: nanoid(),
    seed,
    startedAt: Date.now(),
    stageIndex: 0,
    stages: generateStages(seed, DEFAULT_CLICK, DEFAULT_HPS),
    happy: 0,
    totalPets: 0,
    clickPower: DEFAULT_CLICK,
    pps: DEFAULT_HPS,
    tempMods: {},
    alive: true,
    cleared: false,
  };
}

function computeClickOutcome(
  run: RunState,
  options: { boss: boolean },
  timestamp = Date.now(),
): { gain: number; crit: boolean } {
  const aggregates = getSkillAggregates(timestamp);
  const base = run.clickPower;
  const clickMult = (run.tempMods.clickMult ?? 1) * aggregates.clickMult;
  let gain = base * clickMult;

  if (options.boss) {
    gain *= run.tempMods.bossClickMult ?? 1;
  }

  const critChance = clamp01((run.tempMods.critChance ?? 0) + aggregates.critChancePlus);
  const critMult = Math.max(1, (run.tempMods.critMult ?? 2) + aggregates.critMultPlus);
  const crit = Math.random() < critChance;
  if (crit) {
    gain *= critMult;
  }

  return { gain, crit };
}

function appendFloatingText(
  texts: FloatingText[],
  value: number,
  crit: boolean,
): FloatingText[] {
  const critText = crit ? ` ${i18n.t('clickPad.floatingCrit')}` : '';
  const next: FloatingText = {
    id: nanoid(),
    value: `+${fmt(value)}${critText}`,
    life: 1.2,
    offsetX: (Math.random() - 0.5) * 40,
    offsetY: Math.random() * -30,
  };
  return [...texts.slice(-FLOATING_TEXT_MAX + 1), next];
}

function decayFloatingTexts(texts: FloatingText[], dt: number): FloatingText[] {
  if (dt <= 0) {
    return texts;
  }
  return texts
    .map((text) => ({ ...text, life: text.life - dt }))
    .filter((text) => text.life > 0);
}

function prepareRewardChoices() {
  const state = useRunStore.getState();
  const { run } = state;
  if (!run || run.stageIndex >= run.stages.length) {
    return;
  }
  if (state.showReward) {
    return;
  }
  const stage = run.stages[run.stageIndex];
  const choices = pickRewardChoices(run.seed, run.stageIndex, stage.rewardPool);
  useRunStore.setState({
    showReward: true,
    rewardChoices: choices,
    rewardStageIndex: run.stageIndex,
    bossOpen: false,
  });
}

function advanceStage() {
  const { run } = useRunStore.getState();
  if (!run) {
    return;
  }
  useRunStore.setState((current) => {
    if (!current.run) {
      return current;
    }
    const nextIndex = current.run.stageIndex + 1;
    const cleared = nextIndex >= current.run.stages.length;
    return {
      ...current,
      run: {
        ...current.run,
        stageIndex: Math.min(nextIndex, current.run.stages.length),
        cleared,
      },
    };
  });

  const updated = useRunStore.getState().run;
  if (updated?.cleared) {
    useRunStore.getState().finishRun('cleared');
  }
}

function pickRewardChoices(
  seed: number,
  stageIndex: number,
  pool: RewardCardId[],
): RewardCardId[] {
  const working = [...pool];
  const rng = createRng(normalizedSeedFrom(seed, stageIndex, 0xabc98388));
  shuffleInPlace(rng, working);
  if (working.length >= 3) {
    return working.slice(0, 3);
  }
  const fallback = [...working];
  while (working.length < 3) {
    fallback.forEach((id) => {
      if (working.length < 3) {
        working.push(id);
      }
    });
  }
  return working.slice(0, 3);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampLow(value: number, min: number): number {
  return Math.max(min, value);
}
