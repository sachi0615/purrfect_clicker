import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { fmt } from '../lib/format';
import i18n from '../i18n';
import { createRng, normalizedSeedFrom } from '../lib/rng';
import { getRewardBonus, getRewardCard } from '../data/cards';
import { generateStages } from '../data/stages';
import { getShopItem } from '../data/shopItems';
import { getCharacterPassiveMods, runCharacterOnStart, useCharsStore } from './chars';
import { useMetaStore } from './meta';
import {
  getSkillAggregates,
  syncSkillRunModifiers,
  useSkillsStore,
} from './skills';
import { type BuildArchetype, useBuildStore } from './build';
import type {
  FloatingText,
  RewardCardId,
  RunState,
  RunSummary,
  Stage,
  Enemy,
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
        const chars = useCharsStore.getState();
        const selectedId = chars.selected;
        if (!selectedId) {
          chars.requestSelection();
          return;
        }
        const run = createRun(nextSeed, selectedId);
        runCharacterOnStart(run, (patch) => Object.assign(run, patch));
        useBuildStore.getState().resetRunBuild();
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
        const charMods = getCharacterPassiveMods(state.run.characterId);
        const buildMultipliers = useBuildStore.getState().getFinalMultipliers();
        const ppsMult =
          (state.run.tempMods.ppsMult ?? 1) *
          aggregates.ppsMult *
          (charMods.ppsMult ?? 1) *
          buildMultipliers.ppsMult;
        const effectiveDt = dt * aggregates.tickRateFactor;
        const baseGain = state.run.pps * ppsMult * effectiveDt;
        const gain = baseGain * (1 + buildMultipliers.instantHappyPlus);
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
        const buildMultipliers = useBuildStore.getState().getFinalMultipliers();
        const outcome = computeClickOutcome(state.run, { boss: false }, now, buildMultipliers);
        if (buildMultipliers.skillExtendPerClick > 0) {
          useSkillsStore.getState().extendRunning(buildMultipliers.skillExtendPerClick);
        }
        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const totalGain = outcome.gain + outcome.bonusHappy;
          const floatingTexts = appendFloatingText(
            decayFloatingTexts(current.floatingTexts, 0),
            totalGain,
            outcome.crit,
          );
          return {
            ...current,
            run: {
              ...existingRun,
              happy: existingRun.happy + totalGain,
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
        const bonus = getRewardBonus(cardId);

        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const nextMods = card.apply
            ? card.apply({ ...existingRun.tempMods })
            : { ...existingRun.tempMods };
          const run: RunState = {
            ...existingRun,
            tempMods: nextMods,
          };

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
        useBuildStore.getState().addBonus(bonus);
        syncSkillRunModifiers(updatedRun?.tempMods);

        advanceStage();
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
        const buildMultipliers = useBuildStore.getState().getFinalMultipliers();
        const outcome = computeClickOutcome(state.run, { boss: true }, now, buildMultipliers);
        if (buildMultipliers.skillExtendPerClick > 0) {
          useSkillsStore.getState().extendRunning(buildMultipliers.skillExtendPerClick);
        }
        let defeated = false;
        let adjustedDamage = outcome.gain;
        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const activeStage = existingRun.stages[existingRun.stageIndex];
          if (!activeStage || activeStage.kind !== 'boss' || !activeStage.boss) {
            return current;
          }
          const drainResist = clamp01(
            (buildMultipliers.drainResist ?? 0) + (existingRun.tempMods.drainResist ?? 0),
          );
          const specialResolution = resolveBossSpecials(
            activeStage.boss,
            existingRun,
            now,
            drainResist,
          );
          const adjustedGain = outcome.gain * specialResolution.damageMult;
          adjustedDamage = adjustedGain;
          const bossBefore = activeStage.boss.hp;
          const bossAfter = Math.max(0, bossBefore - adjustedGain);
          if (bossAfter === 0 && bossBefore > 0) {
            defeated = true;
          }
          const updatedBoss = {
            ...specialResolution.boss,
            hp: bossAfter,
          };
          const stages: Stage[] = existingRun.stages.map((s, index) =>
            index === existingRun.stageIndex
              ? { ...s, boss: updatedBoss }
              : s,
          );

          const drainedHappy = Math.min(existingRun.happy, specialResolution.happyDrain);
          const totalGain = adjustedGain + outcome.bonusHappy;
          const floatingTexts = appendFloatingText(
            decayFloatingTexts(current.floatingTexts, 0),
            totalGain,
            outcome.crit,
          );

          return {
            ...current,
            run: {
              ...existingRun,
              stages,
              happy:
                Math.max(
                  0,
                  existingRun.happy -
                    drainedHappy +
                    totalGain +
                    (defeated ? activeStage.boss.rewardHappy : 0),
                ),
              totalPets: existingRun.totalPets + 1,
            },
            floatingTexts,
          };
        });

        if (defeated) {
          set({ bossOpen: false });
        }
        get().checkStageCompletion();
        return adjustedDamage;
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
        useBuildStore.setState((state) => ({
          ...state,
          catSouls: state.catSouls + rewardSouls,
        }));
        useBuildStore.getState().resetRunBuild();
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
          const stageIndex = Math.min(
            existingRun.stageIndex,
            Math.max(0, existingRun.stages.length - 1),
          );
          const loopDepth = existingRun.stages[stageIndex]?.loop ?? 0;
          const gainPenalty = Math.max(0.45, 1 - loopDepth * 0.18);
          const scaledGain = item.gain * gainPenalty;
          const updatedLevels = {
            ...current.shopLevels,
            [itemId]: level + 1,
          };
          const run: RunState = {
            ...existingRun,
            happy: existingRun.happy - price,
            clickPower:
              item.type === 'click'
                ? existingRun.clickPower + scaledGain
                : existingRun.clickPower,
            pps:
              item.type === 'pps'
                ? existingRun.pps + scaledGain
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
        const chars = useCharsStore.getState();
        if (state.run && !state.run.characterId) {
          state.run = null;
          chars.resetSelection();
        } else if (state.run?.characterId && chars.selected !== state.run.characterId) {
          useCharsStore.setState((current) => ({
            ...current,
            selected: state.run?.characterId,
            modalOpen: false,
          }));
        }
        syncSkillRunModifiers(state.run?.tempMods);
      },
    },
  ),
);

type CharacterId = import('./chars').CharacterId;

function createRun(seed: number, characterId: CharacterId): RunState {
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
    characterId,
  };
}

function computeClickOutcome(
  run: RunState,
  options: { boss: boolean },
  timestamp = Date.now(),
  buildMultipliers = useBuildStore.getState().getFinalMultipliers(),
): { gain: number; crit: boolean; bonusHappy: number } {
  const aggregates = getSkillAggregates(timestamp);
  const charMods = getCharacterPassiveMods(run.characterId);
  const base = run.clickPower;
  const clickMult =
    (run.tempMods.clickMult ?? 1) *
    aggregates.clickMult *
    (charMods.clickMult ?? 1) *
    buildMultipliers.clickMult;
  let gain = base * clickMult;

  if (options.boss) {
    const bossClickMult = run.tempMods.bossClickMult ?? 1;
    const bossDamageMult = run.tempMods.bossDamageMult ?? 1;
    const charBossMult = charMods.bossTakenMult ?? 1;
    const buildBossMult = buildMultipliers.bossDamageMult ?? 1;
    gain *= bossClickMult * bossDamageMult * charBossMult * buildBossMult;
  }

  const critChance = clamp01(
    (run.tempMods.critChance ?? 0) +
      aggregates.critChancePlus +
      (charMods.critChancePlus ?? 0) +
      buildMultipliers.critChancePlus,
  );
  const critMult = Math.max(
    1,
    (run.tempMods.critMult ?? 2) +
      aggregates.critMultPlus +
      (charMods.critMultPlus ?? 0) +
      buildMultipliers.critMultPlus,
  );
  const crit = Math.random() < critChance;
  if (crit) {
    gain *= critMult;
  } else if (charMods.nonCritMultiplier !== undefined) {
    gain *= charMods.nonCritMultiplier;
  }

  const instantBonus = gain * buildMultipliers.instantHappyPlus;
  const bonusHappy = (crit ? gain * (charMods.critHappyBonus ?? 0) : 0) + instantBonus;

  return { gain, crit, bonusHappy };
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
  const activeArchetype = useBuildStore.getState().activeArchetype;
  const choices = pickRewardChoices(
    run.seed,
    run.stageIndex,
    stage.rewardPool,
    activeArchetype,
  );
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
  focus: BuildArchetype | undefined,
): RewardCardId[] {
  const rng = createRng(normalizedSeedFrom(seed, stageIndex, 0xabc98388));
  const weighted = pool
    .map((id) => {
      const card = getRewardCard(id);
      const weight = computeCardWeight(card.tier, card.archetype, focus);
      return weight > 0 ? { id: card.id, weight } : null;
    })
    .filter((value): value is { id: RewardCardId; weight: number } => Boolean(value));

  if (weighted.length === 0) {
    return pool.slice(0, 3);
  }

  const selections: RewardCardId[] = [];
  const working = [...weighted];
  const desired = Math.min(3, working.length);

  for (let pickIndex = 0; pickIndex < desired; pickIndex += 1) {
    const totalWeight = working.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight <= 0) {
      selections.push(working.shift()?.id ?? weighted[0].id);
      continue;
    }
    let roll = rng.next() * totalWeight;
    let chosen = 0;
    for (let i = 0; i < working.length; i += 1) {
      roll -= working[i].weight;
      if (roll <= 0) {
        chosen = i;
        break;
      }
      if (i === working.length - 1) {
        chosen = i;
      }
    }
    const [entry] = working.splice(chosen, 1);
    selections.push(entry.id);
  }

  while (selections.length < 3) {
    const duplicate = selections[selections.length % Math.max(1, selections.length)];
    if (!duplicate) {
      break;
    }
    selections.push(duplicate);
  }

  return selections.slice(0, 3);
}

type BossSpecialResolution = {
  boss: Enemy;
  damageMult: number;
  happyDrain: number;
};

function resolveBossSpecials(
  boss: Enemy,
  run: RunState,
  timestamp: number,
  drainResist: number,
): BossSpecialResolution {
  if (!boss.specials || boss.specials.length === 0) {
    return {
      boss,
      damageMult: boss.damageTakenMult ?? 1,
      happyDrain: 0,
    };
  }

  const resist = clamp01(drainResist);
  let damageMult = boss.damageTakenMult ?? 1;
  let happyDrain = 0;

  const specials = boss.specials.map((special) => {
    let activeUntil = special.activeUntil;
    if (activeUntil && activeUntil <= timestamp) {
      activeUntil = undefined;
    }
    let lastTriggeredAt = special.lastTriggeredAt;
    let triggered = false;
    if (lastTriggeredAt === undefined) {
      lastTriggeredAt = timestamp;
    } else if (timestamp - lastTriggeredAt >= special.cooldown * 1000) {
      triggered = true;
      lastTriggeredAt = timestamp;
      if (special.duration > 0) {
        activeUntil = timestamp + special.duration * 1000;
      }

      if (special.type === 'drain') {
        const mitigated = Math.max(0, 1 - resist);
        const rawDrain = run.happy * special.magnitude * mitigated;
        happyDrain += rawDrain;
      }
    }

    const barrierActive =
      special.type === 'barrier' &&
      ((activeUntil !== undefined && activeUntil > timestamp) ||
        (triggered && special.duration <= 0));
    if (barrierActive) {
      damageMult *= special.magnitude;
    }

    return {
      ...special,
      activeUntil,
      lastTriggeredAt,
    };
  });

  return {
    boss: {
      ...boss,
      specials,
      damageTakenMult: boss.damageTakenMult,
    },
    damageMult,
    happyDrain,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampLow(value: number, min: number): number {
  return Math.max(min, value);
}

const TIER_WEIGHTS: Record<1 | 2 | 3, number> = {
  1: 1,
  2: 0.65,
  3: 0.35,
};

function computeCardWeight(
  tier: 1 | 2 | 3,
  archetype: BuildArchetype,
  focus: BuildArchetype | undefined,
): number {
  let weight = TIER_WEIGHTS[tier];
  if (focus && focus === archetype) {
    weight *= 1.5;
  }
  return weight;
}
