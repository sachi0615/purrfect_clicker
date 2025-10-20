import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { MetaProgress, TempMods } from './types';
import { useMetaStore } from './meta';
import { getCharacterActiveOverrides, getCharacterPassiveMods, getCharacterUniqueSkills, useCharsStore } from './chars';
import {
  CHEERFUL_META_PPS_PER_LEVEL,
  META_CD_FLOOR,
  META_COOLDOWN_REDUCTION_PER_LEVEL,
  META_DURATION_PER_LEVEL,
} from '../data/metaUpgrades';

export type SkillId =
  | 'cheerful'
  | 'critBoost'
  | 'clickRush'
  | 'overdrive'
  | 'timeWarp'
  | 'spiritSwarm'
  | 'doubleOrNothing';

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
  skillIds: SkillId[];
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

const BASE_SKILL_IDS: SkillId[] = [
  'cheerful',
  'critBoost',
  'clickRush',
  'overdrive',
  'timeWarp',
];

const BASE_SPECS: Partial<Record<SkillId, BaseSkillSpec>> = {
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
        const bonus = 1.75 + level * CHEERFUL_META_PPS_PER_LEVEL;
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

type CharacterId = import('./chars').CharacterId;

function computeSpecs(
  meta: MetaProgress,
  characterId?: CharacterId,
): { specs: Record<SkillId, SkillSpec>; ids: SkillId[] } {
  const durationLevel = meta.permanentUpgrades['skill.durationPlus'] ?? 0;
  const cdLevel = meta.permanentUpgrades['skill.cdReduce'] ?? 0;
  const durationBonus = durationLevel * META_DURATION_PER_LEVEL;
  const cdFactor = clamp(1 - cdLevel * META_COOLDOWN_REDUCTION_PER_LEVEL, META_CD_FLOOR, 2);

  const overrides = getCharacterActiveOverrides(characterId);
  const uniqueSkills = getCharacterUniqueSkills(characterId);

  const ids: SkillId[] = [...BASE_SKILL_IDS];
  const specs: Record<SkillId, SkillSpec> = {} as Record<SkillId, SkillSpec>;

  BASE_SKILL_IDS.forEach((id) => {
    const baseSource = BASE_SPECS[id];
    if (!baseSource) {
      return;
    }
    const base = cloneSkillSpec(baseSource);
    const override = overrides[id];
    const withOverride = override ? applyOverride(base, override) : base;
    const metaOverrides = withOverride.applyMeta?.(meta) ?? {};
    const mergedEffect: SkillEffect = {
      ...withOverride.effect,
      ...metaOverrides.effect,
    };

    const baseDuration = metaOverrides.baseDuration ?? withOverride.baseDuration;
    const baseCd = metaOverrides.baseCd ?? withOverride.baseCd;

    const duration = Math.max(0.5, baseDuration + durationBonus);
    const cooldown = Math.max(0.5, baseCd * cdFactor);

    specs[id] = {
      ...withOverride,
      baseDuration: duration,
      baseCd: cooldown,
      effect: mergedEffect,
    };
  });

  uniqueSkills.forEach((skill) => {
    const clone = cloneSkillSpec(skill);
    const metaOverrides = clone.applyMeta?.(meta) ?? {};
    const mergedEffect: SkillEffect = {
      ...clone.effect,
      ...metaOverrides.effect,
    };
    const baseDuration = metaOverrides.baseDuration ?? clone.baseDuration;
    const baseCd = metaOverrides.baseCd ?? clone.baseCd;
    const duration = Math.max(0.5, baseDuration + durationBonus);
    const cooldown = Math.max(0.5, baseCd * cdFactor);
    specs[clone.id] = {
      ...clone,
      baseDuration: duration,
      baseCd: cooldown,
      effect: mergedEffect,
    };
    if (!ids.includes(clone.id)) {
      ids.push(clone.id);
    }
  });

  return { specs, ids };
}

function cloneSkillSpec(spec: SkillSpec): SkillSpec {
  return {
    ...spec,
    effect: { ...spec.effect },
  };
}

function applyOverride(base: SkillSpec, override: Partial<SkillSpec>): SkillSpec {
  return {
    ...base,
    ...override,
    effect: {
      ...base.effect,
      ...override.effect,
    },
  };
}

function ensureRuntime(
  source?: Partial<Record<SkillId, SkillRuntime>>,
  now = Date.now(),
  skillIds: SkillId[] = BASE_SKILL_IDS,
): Record<SkillId, SkillRuntime> {
  const runtime: Record<SkillId, SkillRuntime> = {} as Record<SkillId, SkillRuntime>;
  skillIds.forEach((id) => {
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
  const charMods = getCharacterPassiveMods();
  const durationBonus =
    (charMods.skillDurationPlus ?? 0) + (tempMods?.skillDurationPlus ?? 0);
  const cooldownMultRaw =
    (charMods.skillCdMult ?? 1) * (tempMods?.skillCdMult ?? 1);
  const cooldownMult = cooldownMultRaw <= 0 ? 0.1 : cooldownMultRaw;
  return {
    durationBonus,
    cooldownMult,
  };
}

const createSkillsStore = persist<SkillsState, [], [], Pick<SkillsState, 'rt'>>(
  (set, get) => {
    const meta = useMetaStore.getState().meta;
    const chars = useCharsStore.getState();
    const computed = computeSpecs(meta, chars.selected);
    const initialSkillIds = computed.ids;
    const baseModifiers = extractRuntimeModifiers(undefined);
    return {
      specs: computed.specs,
      skillIds: initialSkillIds,
      rt: ensureRuntime(undefined, Date.now(), initialSkillIds),
      runModifiers: baseModifiers,
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
          current.skillIds.forEach((id) => {
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
          rt: ensureRuntime(undefined, Date.now(), current.skillIds),
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
    partialize: (state) => ({ rt: state.rt }),
    onRehydrateStorage: () => (persisted, error) => {
      const meta = useMetaStore.getState().meta;
      const chars = useCharsStore.getState();
      const computed = computeSpecs(meta, chars.selected);
      const now = Date.now();
      if (error) {
        console.error('Failed to rehydrate skill store', error);
      }
      useSkillsStore.setState((current) => ({
        ...current,
        specs: computed.specs,
        skillIds: computed.ids,
        rt: ensureRuntime(persisted?.rt ?? current.rt, now, computed.ids),
        runModifiers: extractRuntimeModifiers(undefined),
      }));
    },
  },
);

export const useSkillsStore = create<SkillsState>()(createSkillsStore);

let lastMeta = useMetaStore.getState().meta;
useMetaStore.subscribe((state) => {
  if (state.meta === lastMeta) {
    return;
  }
  lastMeta = state.meta;
  const chars = useCharsStore.getState();
  const computed = computeSpecs(state.meta, chars.selected);
  const now = Date.now();
  useSkillsStore.setState((current) => ({
    ...current,
    specs: computed.specs,
    skillIds: computed.ids,
    rt: ensureRuntime(current.rt, now, computed.ids),
  }));
});

let lastCharacter = useCharsStore.getState().selected;
useCharsStore.subscribe((state) => {
  if (state.selected === lastCharacter) {
    return;
  }
  lastCharacter = state.selected;
  const meta = useMetaStore.getState().meta;
  const computed = computeSpecs(meta, state.selected);
  const now = Date.now();
  useSkillsStore.setState((current) => ({
    ...current,
    specs: computed.specs,
    skillIds: computed.ids,
    rt: ensureRuntime(current.rt, now, computed.ids),
    runModifiers: extractRuntimeModifiers(undefined),
  }));
});

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

  state.skillIds.forEach((id) => {
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

export function getBaseSkillSpec(id: SkillId): SkillSpec {
  const base = BASE_SPECS[id];
  if (!base) {
    throw new Error(`No base spec for skill ${id}`);
  }
  return {
    ...base,
    effect: { ...base.effect },
  };
}

export function isBaseSkill(id: SkillId): boolean {
  return Boolean(BASE_SPECS[id]);
}




