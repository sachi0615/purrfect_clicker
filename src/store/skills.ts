import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { MetaProgress, TempMods } from './types';
import { useMetaStore } from './meta';

export type SkillId = 'cheerful' | 'critBoost' | 'clickRush' | 'overdrive' | 'timeWarp';

type SkillEffect = {
  clickMult?: number;
  ppsMult?: number;
  critChancePlus?: number;
  critMultPlus?: number;
  tickRateMult?: number;
};

export type SkillSpec = {
  id: SkillId;
  nameKey: string;
  descKey: string;
  baseCd: number;
  baseDuration: number;
  icon?: string;
  effect: SkillEffect;
  applyMeta?: (
    meta: MetaProgress,
  ) => Partial<Pick<SkillSpec, 'baseCd' | 'baseDuration'>> & {
    effect?: Partial<SkillEffect>;
  };
};

export type SkillRuntime = {
  coolingDownUntil: number;
  runningUntil: number;
  lastTriggeredAt?: number;
};

type SkillRuntimeModifiers = {
  durationBonus: number;
  cooldownMult: number;
};

type SkillsState = {
  specs: Record<SkillId, SkillSpec>;
  rt: Record<SkillId, SkillRuntime>;
  runModifiers: SkillRuntimeModifiers;
  isRunning: (id: SkillId) => boolean;
  isCooling: (id: SkillId) => boolean;
  remaining: (id: SkillId) => { cd: number; dur: number };
  trigger: (id: SkillId) => void;
  tick: (now: number) => void;
  resetAll: () => void;
  setRunModifiers: (mods: SkillRuntimeModifiers) => void;
};

export type SkillAggregates = {
  clickMult: number;
  ppsMult: number;
  critChancePlus: number;
  critMultPlus: number;
  tickRateFactor: number;
  activeSkills: SkillId[];
};

type BaseSkillSpec = SkillSpec;

const SKILL_STORAGE_KEY = 'purrfect-skills';

const META_DURATION_PER_LEVEL = 1; // +1 second per meta duration level
const META_CD_REDUCE_PER_LEVEL = 0.05; // -5% cooldown per level
const META_CD_FLOOR = 0.3; // cooldown cannot drop below 30% of base
const CHEERFUL_META_PPS_BONUS_PER_LEVEL = 0.05;

const SKILL_IDS: SkillId[] = [
  'cheerful',
  'critBoost',
  'clickRush',
  'overdrive',
  'timeWarp',
];

const BASE_SPECS: Record<SkillId, BaseSkillSpec> = {
  cheerful: {
    id: 'cheerful',
    nameKey: 'skill.cheerful.name',
    descKey: 'skill.cheerful.desc',
    baseCd: 35,
    baseDuration: 10,
    icon: 'Sparkles',
    effect: {
      ppsMult: 1.75,
    },
    applyMeta: (meta) => {
      const level = meta.permanentUpgrades['skill.cheerful.ppsBonus'] ?? 0;
      if (level > 0) {
        const bonus = 1.75 + level * CHEERFUL_META_PPS_BONUS_PER_LEVEL;
        return {
          effect: {
            ppsMult: bonus,
          },
        };
      }
      return {};
    },
  },
  critBoost: {
    id: 'critBoost',
    nameKey: 'skill.critBoost.name',
    descKey: 'skill.critBoost.desc',
    baseCd: 40,
    baseDuration: 12,
    icon: 'Target',
    effect: {
      critChancePlus: 0.2,
      critMultPlus: 0.5,
    },
  },
  clickRush: {
    id: 'clickRush',
    nameKey: 'skill.clickRush.name',
    descKey: 'skill.clickRush.desc',
    baseCd: 30,
    baseDuration: 8,
    icon: 'Zap',
    effect: {
      clickMult: 1.6,
    },
  },
  overdrive: {
    id: 'overdrive',
    nameKey: 'skill.overdrive.name',
    descKey: 'skill.overdrive.desc',
    baseCd: 50,
    baseDuration: 10,
    icon: 'Flame',
    effect: {
      ppsMult: 1.3,
      clickMult: 1.3,
    },
  },
  timeWarp: {
    id: 'timeWarp',
    nameKey: 'skill.timeWarp.name',
    descKey: 'skill.timeWarp.desc',
    baseCd: 35,
    baseDuration: 6,
    icon: 'Hourglass',
    effect: {
      tickRateMult: 0.7,
    },
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeSpecs(meta: MetaProgress): Record<SkillId, SkillSpec> {
  const durationLevel = meta.permanentUpgrades['skill.durationPlus'] ?? 0;
  const cdLevel = meta.permanentUpgrades['skill.cdReduce'] ?? 0;
  const durationBonus = durationLevel * META_DURATION_PER_LEVEL;
  const cdFactor = clamp(1 - cdLevel * META_CD_REDUCE_PER_LEVEL, META_CD_FLOOR, 2);

  return SKILL_IDS.reduce<Record<SkillId, SkillSpec>>((acc, id) => {
    const base = BASE_SPECS[id];
    const metaOverrides = base.applyMeta?.(meta) ?? {};
    const mergedEffect: SkillEffect = {
      ...base.effect,
      ...metaOverrides.effect,
    };

    const baseDuration = metaOverrides.baseDuration ?? base.baseDuration;
    const baseCd = metaOverrides.baseCd ?? base.baseCd;

    const duration = Math.max(0.5, baseDuration + durationBonus);
    const cooldown = Math.max(0.5, baseCd * cdFactor);

    acc[id] = {
      ...base,
      baseDuration: duration,
      baseCd: cooldown,
      effect: mergedEffect,
    };
    return acc;
  }, {} as Record<SkillId, SkillSpec>);
}

function ensureRuntime(
  source?: Partial<Record<SkillId, SkillRuntime>>,
  now = Date.now(),
): Record<SkillId, SkillRuntime> {
  const runtime: Record<SkillId, SkillRuntime> = {} as Record<SkillId, SkillRuntime>;
  SKILL_IDS.forEach((id) => {
    const original = source?.[id];
    const coolingDownUntil =
      original?.coolingDownUntil && original.coolingDownUntil > now
        ? original.coolingDownUntil
        : 0;
    const runningUntil =
      original?.runningUntil && original.runningUntil > now ? original.runningUntil : 0;
    runtime[id] = {
      coolingDownUntil,
      runningUntil,
      lastTriggeredAt: original?.lastTriggeredAt,
    };
  });
  return runtime;
}

function extractRuntimeModifiers(tempMods?: TempMods | null): SkillRuntimeModifiers {
  const durationBonus = tempMods?.skillDurationPlus ?? 0;
  const cooldownMultRaw = tempMods?.skillCdMult ?? 1;
  const cooldownMult = cooldownMultRaw <= 0 ? 0.1 : cooldownMultRaw;
  return {
    durationBonus,
    cooldownMult,
  };
}

const createSkillsStore = persist<SkillsState>(
  (set, get) => {
    const meta = useMetaStore.getState().meta;
    return {
      specs: computeSpecs(meta),
      rt: ensureRuntime(),
      runModifiers: {
        durationBonus: 0,
        cooldownMult: 1,
      },
      isRunning: (id) => {
        const runtime = get().rt[id];
        return runtime?.runningUntil ? runtime.runningUntil > Date.now() : false;
      },
      isCooling: (id) => {
        const runtime = get().rt[id];
        return runtime?.coolingDownUntil ? runtime.coolingDownUntil > Date.now() : false;
      },
      remaining: (id) => {
        const runtime = get().rt[id];
        const now = Date.now();
        const cd = runtime?.coolingDownUntil
          ? Math.max(0, (runtime.coolingDownUntil - now) / 1000)
          : 0;
        const dur = runtime?.runningUntil ? Math.max(0, (runtime.runningUntil - now) / 1000) : 0;
        return { cd, dur };
      },
      trigger: (id) => {
        const state = get();
        const spec = state.specs[id];
        if (!spec) {
          return;
        }
        const now = Date.now();
        const runtime = state.rt[id];
        if (runtime) {
          if (runtime.runningUntil > now || runtime.coolingDownUntil > now) {
            return;
          }
        }

        const durationSeconds = Math.max(
          0.5,
          spec.baseDuration + state.runModifiers.durationBonus,
        );
        const cooldownSeconds = Math.max(
          0.5,
          spec.baseCd * state.runModifiers.cooldownMult,
        );

        const nextRuntime: SkillRuntime = {
          coolingDownUntil: now + cooldownSeconds * 1000,
          runningUntil: now + durationSeconds * 1000,
          lastTriggeredAt: now,
        };

        set((current) => ({
          ...current,
          rt: {
            ...current.rt,
            [id]: nextRuntime,
          },
        }));
      },
      tick: (now) => {
        set((current) => {
          let updated: Record<SkillId, SkillRuntime> | null = null;
          SKILL_IDS.forEach((id) => {
            const runtime = current.rt[id];
            if (!runtime) {
              return;
            }
            let changed = false;
            let runningUntil = runtime.runningUntil;
            let coolingDownUntil = runtime.coolingDownUntil;

            if (runningUntil > 0 && runningUntil <= now) {
              runningUntil = 0;
              changed = true;
            }
            if (coolingDownUntil > 0 && coolingDownUntil <= now) {
              coolingDownUntil = 0;
              changed = true;
            }

            if (changed) {
              if (!updated) {
                updated = { ...current.rt };
              }
              updated[id] = {
                ...runtime,
                runningUntil,
                coolingDownUntil,
              };
            }
          });

          if (!updated) {
            return current;
          }

          return {
            ...current,
            rt: updated,
          };
        });
      },
      resetAll: () => {
        set((current) => ({
          ...current,
          rt: ensureRuntime(),
        }));
      },
      setRunModifiers: (mods) => {
        set((current) => ({
          ...current,
          runModifiers: mods,
        }));
      },
    };
  },
  {
    name: SKILL_STORAGE_KEY,
    partialize: (state) => ({
      rt: state.rt,
    }),
    onRehydrateStorage: () => (state, error) => {
      const meta = useMetaStore.getState().meta;
      const now = Date.now();
      if (error) {
        console.error('Failed to rehydrate skill store', error);
      }
      useSkillsStore.setState((current) => ({
        ...current,
        specs: computeSpecs(meta),
        rt: ensureRuntime(state?.rt ?? current.rt, now),
      }));
    },
  },
);

export const useSkillsStore = create<SkillsState>(createSkillsStore);

useMetaStore.subscribe(
  (state) => state.meta,
  (meta) => {
    useSkillsStore.setState((current) => ({
      ...current,
      specs: computeSpecs(meta),
    }));
  },
);

export function syncSkillRunModifiers(tempMods?: TempMods | null) {
  const mods = extractRuntimeModifiers(tempMods);
  useSkillsStore.getState().setRunModifiers(mods);
}

export function getSkillAggregates(now = Date.now()): SkillAggregates {
  const state = useSkillsStore.getState();
  let clickMult = 1;
  let ppsMult = 1;
  let critChancePlus = 0;
  let critMultPlus = 0;
  let tickRateFactor = 1;
  const activeSkills: SkillId[] = [];

  SKILL_IDS.forEach((id) => {
    const runtime = state.rt[id];
    if (!runtime || runtime.runningUntil <= now) {
      return;
    }
    const effect = state.specs[id]?.effect;
    if (!effect) {
      return;
    }
    activeSkills.push(id);
    if (typeof effect.clickMult === 'number') {
      clickMult *= effect.clickMult;
    }
    if (typeof effect.ppsMult === 'number') {
      ppsMult *= effect.ppsMult;
    }
    if (typeof effect.critChancePlus === 'number') {
      critChancePlus += effect.critChancePlus;
    }
    if (typeof effect.critMultPlus === 'number') {
      critMultPlus += effect.critMultPlus;
    }
    if (typeof effect.tickRateMult === 'number' && effect.tickRateMult > 0) {
      tickRateFactor *= 1 / effect.tickRateMult;
    }
  });

  return {
    clickMult,
    ppsMult,
    critChancePlus,
    critMultPlus,
    tickRateFactor,
    activeSkills,
  };
}

export { SKILL_IDS };

export function getBaseSkillSpec(id: SkillId): SkillSpec {
  const base = BASE_SPECS[id];
  return {
    ...base,
    effect: { ...base.effect },
  };
}
