import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge, MousePointer2, Repeat, Sparkles, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BUILD_ARCHETYPE_INFO, type BuildArchetype, getBonusById, useBuildStore } from '../store/build';
import { useRunStore } from '../store/run';

const ICONS: Record<BuildArchetype, typeof MousePointer2> = {
  burst: MousePointer2,
  engine: Gauge,
  luck: Sparkles,
  tempo: Repeat,
  utility: Wand2,
};

export function BuildSelect() {
  const { t } = useTranslation();
  const run = useRunStore((state) => state.run);
  const showSummary = useRunStore((state) => state.showSummary);
  const activeArchetype = useBuildStore((state) => state.activeArchetype);
  const acquired = useBuildStore((state) => state.acquired);
  const setActive = useBuildStore((state) => state.setActive);

  const [dismissedRunId, setDismissedRunId] = useState<string | null>(null);

  useEffect(() => {
    if (!run) {
      setDismissedRunId(null);
      return;
    }
    setDismissedRunId((prev) => (prev === run.runId ? prev : null));
  }, [run?.runId]);

  const shouldShow =
    Boolean(run?.alive) &&
    !showSummary &&
    !activeArchetype &&
    acquired.length === 0 &&
    dismissedRunId !== run?.runId;

  const cards = useMemo(() => {
    return Object.values(BUILD_ARCHETYPE_INFO).map((info) => {
      const Icon = ICONS[info.id];
      const bonuses = info.signatureBonusIds
        .map((bonusId) => {
          try {
            return getBonusById(bonusId);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      return { info, Icon, bonuses };
    });
  }, []);

  if (!shouldShow) {
    return null;
  }

  const handleSkip = () => {
    if (run) {
      setDismissedRunId(run.runId);
    }
  };

  const handleSelect = (archetype: BuildArchetype) => {
    if (run) {
      setActive(archetype);
      setDismissedRunId(run.runId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-5xl space-y-6 rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl md:p-8"
      >
        <header className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold text-plum-900 md:text-3xl">
            {t('build.select.title')}
          </h2>
          <p className="text-sm text-plum-600 md:text-base">{t('build.select.helper')}</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ info, Icon, bonuses }) => (
            <button
              type="button"
              key={info.id}
              onClick={() => handleSelect(info.id)}
              className={[
                'group flex h-full flex-col gap-3 rounded-2xl border border-plum-100 bg-white/80 p-4 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 md:p-5',
              ].join(' ')}
            >
              <div
                className={[
                  'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide md:text-sm',
                  'bg-gradient-to-r text-white shadow',
                  info.gradientFrom,
                  info.gradientTo,
                ].join(' ')}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t(info.titleKey)}
              </div>
              <p className="text-sm text-plum-600 md:text-base">{t(info.descKey)}</p>
              <ul className="mt-2 flex flex-col gap-1 text-xs text-plum-500 md:text-sm">
                {bonuses.map((bonus) =>
                  bonus ? (
                    <li
                      key={bonus.id}
                      className="flex items-center gap-2 rounded-xl bg-plum-50/80 px-3 py-1.5 text-plum-600 transition group-hover:bg-plum-100/80"
                    >
                      <span className="h-2 w-2 rounded-full bg-plum-300" aria-hidden />
                      <span>{t(bonus.nameKey)}</span>
                    </li>
                  ) : null,
                )}
              </ul>
              <span className="mt-auto inline-flex w-fit items-center rounded-full bg-plum-500/10 px-3 py-1 text-xs font-semibold text-plum-600 transition group-hover:bg-plum-500/20 md:text-sm">
                {t('build.select.choose')}
              </span>
            </button>
          ))}
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-full border border-plum-200 bg-white px-5 py-2 text-sm font-semibold text-plum-600 shadow-sm transition hover:border-plum-300 hover:text-plum-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 md:text-base"
          >
            {t('build.select.skip')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
