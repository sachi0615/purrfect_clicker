import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Section } from './Section';
import { listMetaUpgrades, computeMetaUpgradeCost } from '../data/metaUpgrades';
import { fmt } from '../lib/format';
import { useMetaStore } from '../store/meta';
import { pushToast } from '../store/toast';

export function MetaPanel() {
  const { t } = useTranslation();
  const meta = useMetaStore((state) => state.meta);
  const buyUpgrade = useMetaStore((state) => state.buyUpgrade);

  const upgrades = listMetaUpgrades().map((spec) => {
    const level = meta.permanentUpgrades[spec.id] ?? 0;
    const maxed = spec.maxLevel !== undefined && level >= spec.maxLevel;
    const cost = maxed ? 0 : computeMetaUpgradeCost(spec, level);
    const descValues = spec.describe(level);
    return {
      spec,
      level,
      maxed,
      cost,
      affordable: !maxed && meta.catSouls >= cost,
      descValues,
    };
  });

  const handlePurchase = (id: (typeof upgrades)[number]['spec']['id'], name: string) => {
    const success = buyUpgrade(id);
    if (success) {
      pushToast(t('meta.toast.purchased', { name }), 'success');
    }
  };

  return (
    <Section
      title={t('meta.title')}
      description={t('meta.helper')}
      icon={<Sparkles className="h-5 w-5 text-plum-500" aria-hidden />}
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-plum-100 bg-white/80 p-4 text-center text-2xl font-bold text-plum-700 shadow-sm md:text-3xl">
          {fmt(meta.catSouls)}
        </div>
        <ul className="flex flex-col gap-3">
          {upgrades.map(({ spec, level, maxed, cost, affordable, descValues }) => {
            const name = t(spec.nameKey);
            const description = t(spec.descKey, {
              ...descValues,
              level,
              nextLevel: level + 1,
            });
            const levelLabel = spec.maxLevel !== undefined
              ? t('meta.upgrades.levelCapped', { level, max: spec.maxLevel })
              : t('meta.upgrades.levelInfinite', { level });
            return (
              <li
                key={spec.id}
                className="flex flex-col gap-3 rounded-2xl border border-plum-100 bg-white/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-5"
              >
                <div className="space-y-1 text-sm text-plum-600 md:text-base">
                  <p className="text-base font-semibold text-plum-900 md:text-lg">{name}</p>
                  <p>{description}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-plum-400 md:text-sm">
                    {levelLabel}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {maxed ? (
                    <span className="rounded-full bg-plum-100 px-4 py-2 text-xs font-semibold text-plum-500 md:text-sm">
                      {t('meta.upgrades.maxed')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePurchase(spec.id, name)}
                      disabled={!affordable}
                      className="rounded-full bg-plum-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-plum-200 disabled:text-plum-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 md:text-base"
                    >
                      {t('meta.upgrades.buy', { cost: fmt(cost) })}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
