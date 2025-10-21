import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { getRewardBonus, getRewardCard } from '../data/cards';
import { useRunStore } from '../store/run';
import { BUILD_ARCHETYPE_INFO, useBuildStore } from '../store/build';
import { pushToast } from '../store/toast';

export function RewardPicker() {
  const { t } = useTranslation();
  const showReward = useRunStore((state) => state.showReward);
  const rewardChoices = useRunStore((state) => state.rewardChoices);
  const applyReward = useRunStore((state) => state.applyReward);
  const activeArchetype = useBuildStore((state) => state.activeArchetype);

  if (!showReward) {
    return null;
  }

  const handleSelect = (cardId: string) => {
    const bonus = getRewardBonus(cardId);
    const card = getRewardCard(cardId);
    applyReward(cardId);
    const archetypeLabel = t(BUILD_ARCHETYPE_INFO[bonus.archetype].titleKey);
    const cardName = t(bonus.nameKey);
    pushToast(
      t('build.reward.toast', { archetype: archetypeLabel, bonus: cardName }),
      'success',
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-4xl rounded-3xl border border-white/40 bg-white/95 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t('reward.title')}
      >
        <h3 className="text-xl font-semibold text-plum-900 md:text-2xl">{t('reward.title')}</h3>
        <p className="mt-1 text-sm text-plum-600 md:text-base">{t('reward.helper')}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {rewardChoices.map((id) => {
            const card = getRewardCard(id);
            const bonus = getRewardBonus(id);
            const info = BUILD_ARCHETYPE_INFO[card.archetype];
            const name = t(bonus.nameKey);
            const description = t(bonus.descKey);
            const isFocus = activeArchetype && activeArchetype === card.archetype;
            return (
              <motion.button
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                key={card.id}
                onClick={() => handleSelect(card.id)}
                className="flex h-full flex-col items-start gap-3 rounded-2xl border border-plum-200 bg-white/90 p-4 text-left shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 hover:border-transparent hover:shadow-xl md:p-5"
                aria-label={`${t('reward.title')}: ${name}`}
              >
                <span
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide md:text-sm',
                    info.badgeRing,
                    'border-transparent bg-gradient-to-r text-white shadow',
                    info.gradientFrom,
                    info.gradientTo,
                  ].join(' ')}
                >
                  {t(info.titleKey)}
                  {isFocus ? (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[0.65rem] font-bold">
                      {t('build.reward.focus')}
                    </span>
                  ) : null}
                </span>
                <span className="text-lg font-semibold text-plum-900 md:text-xl">{name}</span>
                <span className="text-sm text-plum-600 md:text-base">{description}</span>
                <div className="mt-auto flex w-full items-center justify-between">
                  <span className="rounded-full bg-plum-100 px-3 py-1 text-xs font-semibold text-plum-600 md:text-sm">
                    {t('build.reward.tier', { tier: card.tier })}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-plum-500/10 px-3 py-1 text-xs font-semibold text-plum-600 md:text-sm">
                    {t('reward.button')}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
