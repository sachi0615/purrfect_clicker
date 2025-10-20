import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  computeMetaUpgradeCost,
  getMetaUpgradeSpec,
  type MetaUpgradeId,
  type MetaUpgradeSpec,
} from '../data/metaUpgrades';
import type { MetaProgress } from './types';

type MetaStore = {
  meta: MetaProgress;
  addSouls: (amount: number) => void;
  spendSouls: (amount: number) => boolean;
  buyUpgrade: (upgradeId: MetaUpgradeId) => boolean;
  resetMeta: () => void;
};

const initialMeta: MetaProgress = {
  catSouls: 0,
  permanentUpgrades: {},
};

export const useMetaStore = create<MetaStore>()(
  persist(
    (set, get) => ({
      meta: initialMeta,
      addSouls: (amount) => {
        if (amount <= 0) {
          return;
        }
        set((state) => ({
          meta: {
            ...state.meta,
            catSouls: state.meta.catSouls + amount,
          },
        }));
      },
      spendSouls: (amount) => {
        if (amount <= 0) {
          return true;
        }
        const { meta } = get();
        if (meta.catSouls < amount) {
          return false;
        }
        set({
          meta: {
            ...meta,
            catSouls: meta.catSouls - amount,
          },
        });
        return true;
      },
      buyUpgrade: (upgradeId) => {
        let spec: MetaUpgradeSpec;
        try {
          spec = getMetaUpgradeSpec(upgradeId);
        } catch {
          return false;
        }

        const { meta, spendSouls } = get();
        const currentLevel = meta.permanentUpgrades[upgradeId] ?? 0;
        if (spec.maxLevel !== undefined && currentLevel >= spec.maxLevel) {
          return false;
        }

        const cost = computeMetaUpgradeCost(spec, currentLevel);
        if (!spendSouls(cost)) {
          return false;
        }

        set((state) => ({
          meta: {
            ...state.meta,
            permanentUpgrades: {
              ...state.meta.permanentUpgrades,
              [upgradeId]: (state.meta.permanentUpgrades[upgradeId] ?? 0) + 1,
            },
          },
        }));

        return true;
      },
      resetMeta: () => {
        set({ meta: initialMeta });
      },
    }),
    {
      name: 'purrfect-meta',
    },
  ),
);
