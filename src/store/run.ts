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
  RewardTier,
} from './types';

type RunStore = {
  run: RunState | null;
  rewardChoices: RewardCardId[];
  rewardStageIndex: number | null;
  showReward: boolean;
  rewardTier: RewardTier | null;
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
const GAME_STAGE_INTERVAL = 60;
const GAME_STAGE_SCALING = 1.12;

export const useRunStore = create<RunStore>()(
  persist(
    (set, get) => ({
      run: null,
      rewardChoices: [],
      rewardStageIndex: null,
      showReward: false,
      rewardTier: null,
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
          rewardTier: null,
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
        if (!state.run || !state.run.alive || state.showSummary || state.showReward) {
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
        let defeated: RewardTier | null = null;
        let bossFailed = false;
        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const result = applyPassiveGain(existingRun, gain, effectiveDt, now);
          if (result.defeatedTier && !current.showReward) {
            defeated = result.defeatedTier;
          }
          if (result.bossTimeout) {
            bossFailed = true;
          }
          const floatingTexts = decayFloatingTexts(current.floatingTexts, effectiveDt);
          return {
            ...current,
            run: result.run,
            floatingTexts,
          };
        });
        if (bossFailed) {
          get().finishRun('abandon');
          return;
        }
        if (defeated) {
          handleEncounterCleared(defeated);
        }
      },
      click: () => {
        const state = get();
        if (!state.run || !state.run.alive || state.showSummary || state.showReward) {
          return 0;
        }
        const now = Date.now();
        useSkillsStore.getState().tick(now);
        const buildMultipliers = useBuildStore.getState().getFinalMultipliers();
        const outcome = computeClickOutcome(state.run, { boss: false }, now, buildMultipliers);
        if (buildMultipliers.skillExtendPerClick > 0) {
          useSkillsStore.getState().extendRunning(buildMultipliers.skillExtendPerClick);
        }
        let defeated: RewardTier | null = null;
        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const totalGain = outcome.gain + outcome.bonusHappy;
          let run: RunState = {
            ...existingRun,
            happy: existingRun.happy + totalGain,
            totalPets: existingRun.totalPets + 1,
            lastUpdateAt: now,
          };
          run = updateGameStage(run, now);
          const damageResult = applyDamageToCurrentEncounter(run, outcome.gain);
          run = damageResult.run;
          if (damageResult.defeatedTier && !current.showReward) {
            defeated = damageResult.defeatedTier;
          }
          const floatingTexts = appendFloatingText(
            decayFloatingTexts(current.floatingTexts, 0),
            totalGain,
            outcome.crit,
          );
          return {
            ...current,
            run,
            floatingTexts,
          };
        });
        if (defeated) {
          handleEncounterCleared(defeated);
        }
        return outcome.gain;
      },
      clearStage: () => {
        const { run } = get();
        if (!run) {
          return;
        }
        handleEncounterCleared('standard');
      },
      applyReward: (cardId) => {
        const state = get();
        if (
          !state.run ||
          state.rewardStageIndex === null ||
          !state.showReward ||
          !state.rewardTier
        ) {
          return;
        }

        const card = getRewardCard(cardId);
        const bonus = getRewardBonus(cardId);
        const rewardTier = state.rewardTier;

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
            rewardTier: null,
            pickedCards: [...current.pickedCards, cardId],
          };
        });

        const updatedRun = get().run;
        useBuildStore.getState().addBonus(bonus);
        syncSkillRunModifiers(updatedRun?.tempMods);

        postRewardAdvance(rewardTier);
      },
      openBoss: () => {
        const { run } = get();
        if (!run || run.stageIndex >= run.stages.length) {
          return;
        }
        const stage = run.stages[run.stageIndex];
        if (run.enemyIndex < stage.enemies.length) {
          return;
        }
        if (stage.boss.hp <= 0) {
          return;
        }
        set((current) => {
          const existingRun = current.run;
          if (!existingRun) {
            return current;
          }
          const bossTimeLeft =
            existingRun.bossEngaged && existingRun.bossTimeLeft !== null
              ? existingRun.bossTimeLeft
              : stage.boss.timeLimitSec ?? null;
          return {
            ...current,
            bossOpen: true,
            run: {
              ...existingRun,
              bossEngaged: true,
              bossTimeLeft,
            },
          };
        });
      },
      hitBoss: () => {
        const state = get();
        if (!state.run || state.showSummary || state.showReward) {
          return 0;
        }
        const stage = state.run.stages[state.run.stageIndex];
        if (!stage) {
          return 0;
        }
        if (state.run.enemyIndex < stage.enemies.length) {
          return 0;
        }
        if (stage.boss.hp <= 0) {
          return 0;
        }
        if (!state.run.bossEngaged) {
          get().openBoss();
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
          if (!activeStage) {
            return current;
          }
          const activeBoss = activeStage.boss;
          if (existingRun.enemyIndex < activeStage.enemies.length || activeBoss.hp <= 0) {
            return current;
          }
          const bossReward = activeBoss.rewardHappy;
          const drainResist = clamp01(
            (buildMultipliers.drainResist ?? 0) + (existingRun.tempMods.drainResist ?? 0),
          );
          const specialResolution = resolveBossSpecials(
            activeBoss,
            existingRun,
            now,
            drainResist,
          );
          const adjustedGain = outcome.gain * specialResolution.damageMult;
          adjustedDamage = adjustedGain;
          const bossBefore = activeBoss.hp;
          const bossAfter = Math.max(0, bossBefore - adjustedGain);
          if (bossAfter === 0 && bossBefore > 0) {
            defeated = true;
          }
          const updatedBoss = {
            ...specialResolution.boss,
            hp: bossAfter,
          };
          const stages: Stage[] = existingRun.stages.map((s, index) => {
            if (index !== existingRun.stageIndex) {
              return s;
            }
            return {
              ...s,
              boss: updatedBoss,
            };
          });

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
                    (defeated ? bossReward : 0),
                ),
              totalPets: existingRun.totalPets + 1,
              bossEngaged: defeated ? false : existingRun.bossEngaged,
              bossTimeLeft: defeated ? null : existingRun.bossTimeLeft,
              lastUpdateAt: now,
            },
            floatingTexts,
          };
        });

        if (defeated) {
          set({ bossOpen: false });
          handleEncounterCleared('boss');
        }
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
          const difficulty = existingRun.stages[stageIndex]?.difficulty ?? 1;
          const gainPenalty = Math.max(0.45, 1 - (difficulty - 1) * 0.12);
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
          rewardTier: null,
          floatingTexts: [],
        });
      },
      checkStageCompletion: () => {
        const state = get();
        const run = state.run;
        if (!run || !run.alive) {
          return;
        }
        if (run.stageIndex >= run.stages.length && !run.cleared) {
          set((current) => ({
            ...current,
            run: current.run ? { ...current.run, cleared: true } : current.run,
          }));
          get().finishRun('cleared');
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
        rewardTier: state.rewardTier,
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
        state.showReward = false;
        state.rewardTier = null;
        state.rewardChoices = [];
        state.rewardStageIndex = null;
        state.floatingTexts = [];
        const chars = useCharsStore.getState();
        if (state.run && !state.run.characterId) {
          state.run = null;
          chars.resetSelection();
        } else if (state.run && !state.run.stages[0]?.rewardPools) {
          state.run = null;
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
  const timestamp = Date.now();
  return {
    runId: nanoid(),
    seed,
    startedAt: timestamp,
    stageIndex: 0,
    enemyIndex: 0,
    stages: generateStages(seed, DEFAULT_CLICK, DEFAULT_HPS),
    happy: 0,
    totalPets: 0,
    clickPower: DEFAULT_CLICK,
    pps: DEFAULT_HPS,
    tempMods: {},
    alive: true,
    cleared: false,
    characterId,
    bossEngaged: false,
    bossTimeLeft: null,
    gameStage: 1,
    lastUpdateAt: timestamp,
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

function prepareRewardChoices(tier: RewardTier) {
  const state = useRunStore.getState();
  const { run } = state;
  if (!run || run.stageIndex >= run.stages.length) {
    return;
  }
  if (state.showReward) {
    return;
  }
  const stage = run.stages[run.stageIndex];
  const pool =
    stage.rewardPools[tier] ?? Object.values(stage.rewardPools).flat();
  const activeArchetype = useBuildStore.getState().activeArchetype;
  const choices = pickRewardChoices(
    run.seed,
    run.stageIndex,
    pool,
    activeArchetype,
  );
  useRunStore.setState({
    showReward: true,
    rewardChoices: choices,
    rewardStageIndex: run.stageIndex,
    rewardTier: tier,
    bossOpen: tier === 'boss' ? false : state.bossOpen,
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
        enemyIndex: 0,
        bossEngaged: false,
        bossTimeLeft: null,
        cleared,
        lastUpdateAt: Date.now(),
      },
      bossOpen: false,
    };
  });

  const updated = useRunStore.getState().run;
  if (updated?.cleared) {
    useRunStore.getState().finishRun('cleared');
  }
}

function applyPassiveGain(
  run: RunState,
  gain: number,
  dt: number,
  now: number,
): { run: RunState; defeatedTier: RewardTier | null; bossTimeout: boolean } {
  let updated: RunState = {
    ...run,
    happy: run.happy + gain,
  };
  updated = updateGameStage(updated, now);
  const bossTick = tickBossTimer(updated, dt);
  updated = bossTick.run;
  const damageResult = applyDamageToCurrentEncounter(updated, gain);
  updated = damageResult.run;
  const bossTimeout = bossTick.timeout && damageResult.defeatedTier !== 'boss';
  return {
    run: updated,
    defeatedTier: damageResult.defeatedTier,
    bossTimeout,
  };
}

function updateGameStage(run: RunState, now: number): RunState {
  const elapsedSeconds = Math.max(0, Math.floor((now - run.startedAt) / 1000));
  const targetStage = Math.max(1, Math.floor(elapsedSeconds / GAME_STAGE_INTERVAL) + 1);
  if (targetStage <= run.gameStage) {
    if (run.lastUpdateAt !== now) {
      return {
        ...run,
        lastUpdateAt: now,
      };
    }
    return run;
  }
  const levels = targetStage - run.gameStage;
  const scaled = applyGameStageScaling(run, levels);
  return {
    ...scaled,
    gameStage: targetStage,
    lastUpdateAt: now,
  };
}

function applyDamageToCurrentEncounter(
  run: RunState,
  damage: number,
): { run: RunState; defeatedTier: RewardTier | null } {
  if (damage <= 0) {
    return { run, defeatedTier: null };
  }
  const stage = getCurrentStage(run);
  if (!stage) {
    return { run, defeatedTier: null };
  }
  if (run.enemyIndex < stage.enemies.length) {
    const enemy = stage.enemies[run.enemyIndex];
    if (enemy.hp <= 0) {
      return { run, defeatedTier: null };
    }
    const hpBefore = enemy.hp;
    const hpAfter = Math.max(0, hpBefore - damage);
    const defeated = hpAfter === 0 && hpBefore > 0;
    const updatedEnemy: Enemy = {
      ...enemy,
      hp: hpAfter,
    };
    const updatedStage: Stage = {
      ...stage,
      enemies: stage.enemies.map((entry, index) =>
        index === run.enemyIndex ? updatedEnemy : entry,
      ),
    };
    const stages = run.stages.map((s, index) => (index === run.stageIndex ? updatedStage : s));
    let updatedRun: RunState = {
      ...run,
      stages,
    };
    let defeatedTier: RewardTier | null = null;
    if (defeated) {
      const rewardGain = enemy.rewardHappy;
      defeatedTier = enemy.rewardTier ?? 'standard';
      updatedRun = {
        ...updatedRun,
        enemyIndex: Math.min(run.enemyIndex + 1, stage.enemies.length),
        happy: updatedRun.happy + rewardGain,
      };
    }
    return { run: updatedRun, defeatedTier };
  }

  if (!run.bossEngaged) {
    return { run, defeatedTier: null };
  }

  const boss = stage.boss;
  if (boss.hp <= 0) {
    return { run, defeatedTier: null };
  }
  const hpBefore = boss.hp;
  const hpAfter = Math.max(0, hpBefore - damage);
  const defeated = hpAfter === 0 && hpBefore > 0;
  const updatedBoss: Enemy = {
    ...boss,
    hp: hpAfter,
  };
  const stages = run.stages.map((s, index) =>
    index === run.stageIndex
      ? {
          ...s,
          boss: updatedBoss,
        }
      : s,
  );
  let updatedRun: RunState = {
    ...run,
    stages,
  };
  if (defeated) {
    updatedRun = {
      ...updatedRun,
      happy: updatedRun.happy + boss.rewardHappy,
      bossEngaged: false,
      bossTimeLeft: null,
    };
    return { run: updatedRun, defeatedTier: 'boss' };
  }
  return { run: updatedRun, defeatedTier: null };
}

function applyGameStageScaling(run: RunState, levels: number): RunState {
  if (levels <= 0) {
    return run;
  }
  const multiplier = Math.pow(GAME_STAGE_SCALING, levels);
  const stages = run.stages.map((stage, stageIndex) => {
    if (stageIndex < run.stageIndex) {
      return stage;
    }
    const enemies = stage.enemies.map((enemy, enemyIndex) => {
      if (stageIndex === run.stageIndex && enemyIndex < run.enemyIndex) {
        return enemy;
      }
      const maintainRatio =
        stageIndex === run.stageIndex && enemyIndex === run.enemyIndex && enemy.hp > 0;
      return scaleEnemy(enemy, multiplier, maintainRatio);
    });
    const bossMaintain =
      stageIndex === run.stageIndex &&
      run.enemyIndex >= stage.enemies.length &&
      stage.boss.hp > 0;
    const boss = scaleEnemy(stage.boss, multiplier, bossMaintain);
    return {
      ...stage,
      enemies,
      boss,
    };
  });
  return {
    ...run,
    stages,
  };
}

function scaleEnemy(enemy: Enemy, multiplier: number, maintainRatio: boolean): Enemy {
  const baseMax = enemy.baseMaxHp ?? enemy.maxHp;
  const baseReward = enemy.baseRewardHappy ?? enemy.rewardHappy;
  const scaledMax = Math.max(1, Math.floor(baseMax * multiplier));
  const ratio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
  const scaledHp =
    enemy.hp <= 0
      ? 0
      : maintainRatio
      ? Math.max(1, Math.floor(scaledMax * ratio))
      : scaledMax;
  return {
    ...enemy,
    maxHp: scaledMax,
    hp: scaledHp,
    rewardHappy: Math.max(1, Math.floor(baseReward * multiplier)),
    baseMaxHp: baseMax,
    baseRewardHappy: baseReward,
  };
}

function tickBossTimer(run: RunState, dt: number): { run: RunState; timeout: boolean } {
  if (!run.bossEngaged || dt <= 0) {
    return { run, timeout: false };
  }
  const stage = getCurrentStage(run);
  if (!stage) {
    return { run, timeout: false };
  }
  if (stage.boss.hp <= 0) {
    return {
      run: {
        ...run,
        bossTimeLeft: null,
      },
      timeout: false,
    };
  }
  const timeLimit = stage.boss.timeLimitSec;
  if (timeLimit === undefined) {
    return { run, timeout: false };
  }
  const remaining = run.bossTimeLeft ?? timeLimit;
  const next = Math.max(0, remaining - dt);
  const timeout = next <= 0 && stage.boss.hp > 0;
  return {
    run: {
      ...run,
      bossTimeLeft: timeout ? 0 : next,
    },
    timeout,
  };
}

function getCurrentStage(run: RunState): Stage | undefined {
  if (run.stageIndex < 0 || run.stageIndex >= run.stages.length) {
    return undefined;
  }
  return run.stages[run.stageIndex];
}

function handleEncounterCleared(tier: RewardTier) {
  const state = useRunStore.getState();
  if (!state.run || state.showReward) {
    return;
  }
  if (tier === 'boss') {
    useRunStore.setState({ bossOpen: false });
  }
  prepareRewardChoices(tier);
}

function postRewardAdvance(tier: RewardTier) {
  if (tier === 'boss') {
    advanceStage();
    return;
  }
  const { run } = useRunStore.getState();
  if (!run) {
    return;
  }
  const stage = getCurrentStage(run);
  if (!stage) {
    return;
  }
  if (run.enemyIndex >= stage.enemies.length && stage.boss.hp > 0 && !run.bossEngaged) {
    useRunStore.getState().openBoss();
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
