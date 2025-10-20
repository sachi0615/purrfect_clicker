import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { RunState } from './types';
import type { SkillId, SkillSpec } from './skills';
import { CHARACTERS } from '../data/characters';

export type CharacterId = 'critCat' | 'tempoCat' | 'summonerCat' | 'guardianCat' | 'gamblerCat';

export type PassiveSpec = {
  id: string;
  nameKey: string;
  descKey: string;
  mods?: Partial<{
    clickMult: number;
    ppsMult: number;
    critChancePlus: number;
    critMultPlus: number;
    skillCdMult: number;
    skillDurationPlus: number;
    bossTakenMult: number;
    nonCritMultiplier: number;
    critHappyBonus: number;
  }>;
  onRunStart?: (ctx: { mutateRun: (patch: Partial<RunState>) => void }) => void;
};

export type PassiveMods = NonNullable<PassiveSpec['mods']>;

export type CharacterSpec = {
  id: CharacterId;
  nameKey: string;
  descKey: string;
  difficulty?: 'easy' | 'normal' | 'hard';
  passives: PassiveSpec[];
  activeOverrides?: Partial<Record<SkillId, Partial<SkillSpec>>>;
  uniqueSkills?: SkillSpec[];
  recommendedTags?: string[];
  icon?: string;
  color?: string;
};

export type CharsState = {
  selected?: CharacterId;
  specs: Record<CharacterId, CharacterSpec>;
  modalOpen: boolean;
  select: (id: CharacterId) => void;
  getSelectedSpec: () => CharacterSpec | undefined;
  resetSelection: () => void;
  requestSelection: () => void;
  closeModal: () => void;
};

const STORAGE_KEY = 'purrfect_chars';
const STORAGE_VERSION = 1;

const FALLBACK_SPECS = Object.fromEntries(CHARACTERS.map((spec) => [spec.id, spec])) as Record<
  CharacterId,
  CharacterSpec
>;

export const useCharsStore = create<CharsState>()(
  persist(
    (set, get) => ({
      selected: undefined,
      specs: FALLBACK_SPECS,
      modalOpen: true,
      select: (id) => {
        if (!get().specs[id]) {
          return;
        }
        set({ selected: id, modalOpen: false });
      },
      getSelectedSpec: () => {
        const { selected, specs } = get();
        return selected ? specs[selected] : undefined;
      },
      resetSelection: () => {
        set({ selected: undefined, modalOpen: true });
      },
      requestSelection: () => {
        set({ modalOpen: true });
      },
      closeModal: () => {
        if (get().selected) {
          set({ modalOpen: false });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== 'object') {
          return { selected: undefined };
        }
        const maybeId = (persisted as { selected?: string }).selected;
        return { selected: isCharacterId(maybeId) ? maybeId : undefined };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        state.specs = FALLBACK_SPECS;
        if (!state.selected) {
          state.modalOpen = true;
        }
      },
      partialize: (state) => ({
        selected: state.selected,
      }),
    },
  ),
);

export function getSelectedCharacter(): CharacterSpec | undefined {
  return useCharsStore.getState().getSelectedSpec();
}

export function getSelectedCharacterId(): CharacterId | undefined {
  return useCharsStore.getState().selected;
}

export function getCharacterSpec(id: CharacterId | undefined): CharacterSpec | undefined {
  if (!id) {
    return undefined;
  }
  return useCharsStore.getState().specs[id];
}

const MULTIPLICATIVE_KEYS: Array<keyof PassiveMods> = [
  'clickMult',
  'ppsMult',
  'skillCdMult',
  'bossTakenMult',
  'nonCritMultiplier',
];

export function getCharacterPassiveMods(id?: CharacterId): PassiveMods {
  const spec = getCharacterSpec(id ?? getSelectedCharacterId());
  if (!spec) {
    return {};
  }
  return spec.passives.reduce<PassiveMods>((acc, passive) => {
    if (!passive.mods) {
      return acc;
    }
    Object.entries(passive.mods).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      const current = acc[key as keyof PassiveMods];
      if (typeof value !== 'number') {
        return;
      }
      if (isMultiplicativeKey(key)) {
        const numeric = typeof current === 'number' && current !== 0 ? (current as number) : 1;
        acc[key as keyof PassiveMods] = (numeric as number) * value;
        return;
      }
      const numeric = typeof current === 'number' ? (current as number) : 0;
      acc[key as keyof PassiveMods] = numeric + value;
    });
    return acc;
  }, {} as PassiveMods);
}

function isMultiplicativeKey(key: string): key is keyof PassiveMods {
  return MULTIPLICATIVE_KEYS.includes(key as keyof PassiveMods);
}

export function runCharacterOnStart(
  run: RunState,
  mutateRun: (patch: Partial<RunState>) => void,
): void {
  const spec = getCharacterSpec(run.characterId ?? getSelectedCharacterId());
  if (!spec) {
    return;
  }
  spec.passives.forEach((passive) => {
    passive.onRunStart?.({ mutateRun });
  });
}

export function getCharacterActiveOverrides(
  id?: CharacterId,
): Partial<Record<SkillId, Partial<SkillSpec>>> {
  const spec = getCharacterSpec(id ?? getSelectedCharacterId());
  return spec?.activeOverrides ?? {};
}

export function getCharacterUniqueSkills(id?: CharacterId): SkillSpec[] {
  const spec = getCharacterSpec(id ?? getSelectedCharacterId());
  return spec?.uniqueSkills ?? [];
}

export function isCharacterId(candidate: unknown): candidate is CharacterId {
  return typeof candidate === 'string' && candidate in FALLBACK_SPECS;
}
