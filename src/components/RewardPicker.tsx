import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { getRewardCard } from '../data/cards';
import { pushToast } from '../store/toast';
import { useRunStore } from '../store/run';

export function RewardPicker() {
  const { t } = useTranslation();
  const showReward = useRunStore((state) => state.showReward);
  const rewardChoices = useRunStore((state) => state.rewardChoices);
  const applyReward = useRunStore((state) => state.applyReward);

  if (!showReward) {
    return null;
  }

  const handleSelect = (cardId: string) => {
    const card = getRewardCard(cardId);
    const cardName = t(`reward.cards.${card.id}.name`, { defaultValue: card.name });
    applyReward(cardId);
    pushToast(t('reward.toast', { card: cardName }), 'success');
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
            const name = t(`reward.cards.${card.id}.name`, { defaultValue: card.name });
            const description = t(`reward.cards.${card.id}.desc`, {
              defaultValue: card.desc,
            });
            return (
              <motion.button
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                key={card.id}
                onClick={() => handleSelect(card.id)}
                className="flex h-full flex-col items-start gap-3 rounded-2xl border border-plum-200 bg-plum-50/70 p-4 text-left shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 hover:border-plum-400 hover:bg-white md:p-5"
                aria-label={`${t('reward.title')}: ${name}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-plum-400 md:text-sm">
                  {card.id}
                </span>
                <span className="text-lg font-semibold text-plum-900 md:text-xl">{name}</span>
                <span className="text-sm text-plum-600 md:text-base">{description}</span>
                <span className="mt-auto inline-flex items-center rounded-full bg-plum-500/10 px-3 py-1 text-xs font-semibold text-plum-600 md:text-sm">
                  {t('reward.button')}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
