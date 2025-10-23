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
  const rewardTier = useRunStore((state) => state.rewardTier);
  const applyReward = useRunStore((state) => state.applyReward);
  const activeArchetype = useBuildStore((state) => state.activeArchetype);

  if (!showReward) {
    return null;
  }

  const isBossReward = rewardTier === 'boss';
  const title = isBossReward
    ? t('reward.bossTitle', { defaultValue: 'Boss Reward Cards' })
    : t('reward.title');
  const helper = isBossReward
    ? t('reward.bossHelper', { defaultValue: 'Choose one enhanced boss reward.' })
    : t('reward.helper');
  const dialogClassName = [
    'w-full max-w-4xl rounded-3xl p-6 shadow-2xl',
    isBossReward
      ? 'border border-amber-200 bg-gradient-to-br from-white/95 via-amber-50/95 to-white'
      : 'border border-white/40 bg-white/95',
  ].join(' ');

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
        className={dialogClassName}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h3 className="text-xl font-semibold text-plum-900 md:text-2xl">{title}</h3>
        <p className="mt-1 text-sm text-plum-600 md:text-base">{helper}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {rewardChoices.map((id) => {
            const card = getRewardCard(id);
            const bonus = getRewardBonus(id);
            const info = BUILD_ARCHETYPE_INFO[card.archetype];
            const name = t(bonus.nameKey);
            const description = t(bonus.descKey);
            const isFocus = activeArchetype && activeArchetype === card.archetype;
            const categoryLabel = t(`reward.category.${card.category}`, {
              defaultValue:
                card.category === 'stat'
                  ? 'Stat boost'
                  : card.category === 'passive'
                  ? 'Passive skill'
                  : 'Hybrid',
            });
            const rarityLabel = t(`reward.rarity.${card.rarity ?? 'standard'}`, {
              defaultValue: card.rarity === 'boss' ? 'Boss' : 'Standard',
            });
            const cardClassName = [
              'flex h-full flex-col items-start gap-3 rounded-2xl border p-4 text-left shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 hover:border-transparent hover:shadow-xl md:p-5',
              card.rarity === 'boss'
                ? 'border-amber-200 bg-amber-50/90'
                : 'border-plum-200 bg-white/90',
            ].join(' ');
            return (
              <motion.button
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                key={card.id}
                onClick={() => handleSelect(card.id)}
                className={cardClassName}
                aria-label={`${title}: ${name}`}
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
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-plum-500/10 px-3 py-1 text-xs font-semibold text-plum-600 md:text-sm">
                      {categoryLabel}
                    </span>
                    <span className="rounded-full bg-white/50 px-3 py-1 text-xs font-semibold text-plum-500 md:text-sm">
                      {rarityLabel}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

