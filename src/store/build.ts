import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  type BuildArchetype,
  type BuildBonus,
  createInitialMetaNodes,
  getBuildBonus,
  type MetaNode,
} from '../data/builds';

type FinalMultipliers = {
  clickMult: number;
  ppsMult: number;
  critChancePlus: number;
  critMultPlus: number;
  comboHoldPlus: number;
  skillCdMult: number;
  skillExtendPerClick: number;
  dotMult: number;
  enemyCastSlow: number;
  instantHappyPlus: number;
  bossDamageMult: number;
  drainResist: number;
};

export type BuildState = {
  activeArchetype?: BuildArchetype;
  acquired: BuildBonus[];
  metaNodes: Record<string, MetaNode>;
  catSouls: number;
  setActive: (archetype: BuildArchetype | undefined) => void;
  addBonus: (bonus: BuildBonus) => void;
  buyMeta: (nodeId: string) => void;
  getFinalMultipliers: () => FinalMultipliers;
  resetRunBuild: () => void;
};

type Persisted = Pick<BuildState, 'metaNodes' | 'catSouls'>;

const MULTIPLICATIVE_KEYS: Array<keyof NonNullable<BuildBonus['effects']>> = [
  'clickMult',
  'ppsMult',
  'skillCdMult',
  'dotMult',
  'bossDamageMult',
];

const ADDITIVE_KEYS: Array<keyof NonNullable<BuildBonus['effects']>> = [
  'critChancePlus',
  'critMultPlus',
  'comboHoldPlus',
  'skillExtendPerClick',
  'enemyCastSlow',
  'instantHappyPlus',
  'drainResist',
];

const initialMetaNodes = createInitialMetaNodes();

function multiply(current: number | undefined, factor: number): number {
  if (factor === 1) {
    return current ?? 1;
  }
  return (current ?? 1) * factor;
}

function add(current: number | undefined, delta: number): number {
  if (delta === 0) {
    return current ?? 0;
  }
  return (current ?? 0) + delta;
}

function raiseMultipliers(
  current: Partial<BuildBonus['effects']>,
  effects: Partial<BuildBonus['effects']>,
  times: number,
): Partial<BuildBonus['effects']> {
  if (times <= 0) {
    return current;
  }
  const next = { ...current };
  MULTIPLICATIVE_KEYS.forEach((key) => {
    const factor = effects[key];
    if (typeof factor === 'number' && factor !== 1) {
      next[key] = multiply(next[key], Math.pow(factor, times));
    }
  });
  ADDITIVE_KEYS.forEach((key) => {
    const delta = effects[key];
    if (typeof delta === 'number' && delta !== 0) {
      next[key] = add(next[key], times * delta);
    }
  });
  return next;
}

export function foldMeta(nodes: Record<string, MetaNode>): Partial<BuildBonus['effects']> {
  return Object.values(nodes).reduce<Partial<BuildBonus['effects']>>((acc, node) => {
    if (!node.level) {
      return acc;
    }
    return raiseMultipliers(acc, node.perLevel, node.level);
  }, {});
}

export function foldBonuses(bonuses: BuildBonus[]): Partial<BuildBonus['effects']> {
  return bonuses.reduce<Partial<BuildBonus['effects']>>((acc, bonus) => {
    const effects = bonus.effects ?? {};
    const next = { ...acc };
    MULTIPLICATIVE_KEYS.forEach((key) => {
      const factor = effects[key];
      if (typeof factor === 'number' && factor !== 1) {
        next[key] = multiply(next[key], factor);
      }
    });
    ADDITIVE_KEYS.forEach((key) => {
      const delta = effects[key];
      if (typeof delta === 'number' && delta !== 0) {
        next[key] = add(next[key], delta);
      }
    });
    return next;
  }, {});
}

function ensureMetaNodes(saved?: Record<string, MetaNode>): Record<string, MetaNode> {
  const base = createInitialMetaNodes();
  if (!saved) {
    return base;
  }
  const merged: Record<string, MetaNode> = {};
  Object.values(base).forEach((node) => {
    const stored = saved[node.id];
    if (!stored) {
      merged[node.id] = node;
      return;
    }
    merged[node.id] = {
      ...node,
      level: Math.min(stored.level ?? 0, node.maxLevel),
    };
  });
  return merged;
}

export const useBuildStore = create<BuildState>()(
  persist(
    (set, get) => ({
      activeArchetype: undefined,
      acquired: [],
      metaNodes: initialMetaNodes,
      catSouls: 0,
      setActive: (archetype) => {
        set((state) => ({
          ...state,
          activeArchetype: archetype,
        }));
      },
      addBonus: (bonus) => {
        set((state) => ({
          ...state,
          acquired: [...state.acquired, bonus],
        }));
      },
      buyMeta: (nodeId) => {
        set((state) => {
          const node = state.metaNodes[nodeId];
          if (!node) {
            return state;
          }
          if (node.level >= node.maxLevel) {
            return state;
          }
          if (state.catSouls < node.costPerLevel) {
            return state;
          }
          return {
            ...state,
            catSouls: state.catSouls - node.costPerLevel,
            metaNodes: {
              ...state.metaNodes,
              [nodeId]: {
                ...node,
                level: node.level + 1,
              },
            },
          };
        });
      },
      getFinalMultipliers: () => {
        const { metaNodes, acquired } = get();
        const fromMeta = foldMeta(metaNodes);
        const fromBuild = foldBonuses(acquired);
        return {
          clickMult: multiplyAll(1, fromMeta.clickMult, fromBuild.clickMult),
          ppsMult: multiplyAll(1, fromMeta.ppsMult, fromBuild.ppsMult),
          critChancePlus: addAll(0, fromMeta.critChancePlus, fromBuild.critChancePlus),
          critMultPlus: addAll(0, fromMeta.critMultPlus, fromBuild.critMultPlus),
          comboHoldPlus: addAll(0, fromMeta.comboHoldPlus, fromBuild.comboHoldPlus),
          skillCdMult: multiplyAll(1, fromMeta.skillCdMult, fromBuild.skillCdMult),
          skillExtendPerClick: addAll(
            0,
            fromMeta.skillExtendPerClick,
            fromBuild.skillExtendPerClick,
          ),
          dotMult: multiplyAll(1, fromMeta.dotMult, fromBuild.dotMult),
          enemyCastSlow: addAll(0, fromMeta.enemyCastSlow, fromBuild.enemyCastSlow),
          instantHappyPlus: addAll(0, fromMeta.instantHappyPlus, fromBuild.instantHappyPlus),
          bossDamageMult: multiplyAll(1, fromMeta.bossDamageMult, fromBuild.bossDamageMult),
          drainResist: addAll(0, fromMeta.drainResist, fromBuild.drainResist),
        };
      },
      resetRunBuild: () => {
        set((state) => ({
          ...state,
          activeArchetype: undefined,
          acquired: [],
        }));
      },
    }),
    {
      name: 'purrfect-build',
      partialize: (state): Persisted => ({
        metaNodes: state.metaNodes,
        catSouls: state.catSouls,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate build store', error);
        }
        if (!state) {
          return;
        }
        state.acquired = [];
        state.activeArchetype = undefined;
        state.metaNodes = ensureMetaNodes(state.metaNodes);
      },
    },
  ),
);

function multiplyAll(base: number, ...values: Array<number | undefined>): number {
  return values.reduce((acc, value) => {
    if (typeof value === 'number') {
      return acc * value;
    }
    return acc;
  }, base);
}

function addAll(base: number, ...values: Array<number | undefined>): number {
  return values.reduce((acc, value) => {
    if (typeof value === 'number') {
      return acc + value;
    }
    return acc;
  }, base);
}

export function getBonusById(id: string): BuildBonus {
  return getBuildBonus(id);
}

export type { BuildArchetype, BuildBonus, MetaNode } from '../data/builds';
export { BUILD_ARCHETYPE_INFO } from '../data/builds';
