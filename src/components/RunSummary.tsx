import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { getRewardCard } from '../data/cards';
import { fmt } from '../lib/format';
import { useMetaStore } from '../store/meta';
import { useRunStore } from '../store/run';

export function RunSummary() {
  const { t } = useTranslation();
  const showSummary = useRunStore((state) => state.showSummary);
  const summary = useRunStore((state) => state.summary);
  const newRun = useRunStore((state) => state.newRun);
  const resetUi = useRunStore((state) => state.resetUi);
  const catSouls = useMetaStore((state) => state.meta.catSouls);

  if (!showSummary || !summary) {
    return null;
  }

  const cards = summary.cards.map((id) => {
    const card = getRewardCard(id);
    return {
      ...card,
      localizedName: t(`reward.cards.${card.id}.name`, { defaultValue: card.name }),
      localizedDesc: t(`reward.cards.${card.id}.desc`, { defaultValue: card.desc }),
    };
  });

  const handleRestart = () => {
    resetUi();
    newRun();
  };

  const title = summary.cleared ? t('summary.titleCleared') : t('summary.titleEnded');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-3xl rounded-3xl border border-white/50 bg-white/95 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h3 className="text-2xl font-semibold text-plum-900 md:text-3xl">{title}</h3>
        <div className="mt-4 grid gap-4 rounded-2xl border border-plum-100 bg-plum-50/60 p-4 md:grid-cols-2 md:p-6">
          <SummaryItem label={t('summary.totalHappy')} value={`${fmt(summary.totalHappy)}`} />
          <SummaryItem
            label={t('summary.stages')}
            value={`${summary.stagesCleared}/${summary.totalStages}`}
          />
          <SummaryItem label={t('summary.seed')} value={summary.seed} />
          <SummaryItem label={t('summary.souls')} value={`${catSouls}`} />
        </div>
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-plum-500 md:text-base">
            {t('summary.cards')}
          </h4>
          <ul className="grid gap-2 md:grid-cols-2">
            {cards.length === 0 ? (
              <li className="rounded-2xl border border-plum-100 bg-white/80 p-3 text-sm text-plum-500 shadow-sm md:text-base">
                {t('summary.noCards')}
              </li>
            ) : (
              cards.map((card) => (
                <li
                  key={card.id}
                  className="rounded-2xl border border-plum-100 bg-white/80 p-3 shadow-sm md:p-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-plum-400 md:text-sm">
                    {card.id}
                  </div>
                  <div className="text-base font-semibold text-plum-900 md:text-lg">{card.localizedName}</div>
                  <div className="text-sm text-plum-600 md:text-base">{card.localizedDesc}</div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-plum-400 md:text-sm">
            {t('summary.runId')}: <span className="font-mono text-plum-600">{summary.runId}</span>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-plum-400 via-plum-500 to-plum-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 md:text-base"
            aria-label={t('action.restart')}
          >
            {t('action.restart')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

type SummaryItemProps = {
  label: string;
  value: string | number;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="rounded-2xl border border-plum-100 bg-white/80 p-3 text-sm text-plum-600 shadow-sm md:p-4 md:text-base">
      <div className="text-xs uppercase tracking-wide text-plum-400 md:text-sm">{label}</div>
      <div className="text-lg font-semibold text-plum-900 md:text-xl">{value}</div>
    </div>
  );
}
