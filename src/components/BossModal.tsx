import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { fmt } from '../lib/format';
import { Progress } from './Progress';
import { useRunStore } from '../store/run';
import { getSkillAggregates, useSkillsStore } from '../store/skills';

export function BossModal() {
  const { t } = useTranslation();
  const bossOpen = useRunStore((state) => state.bossOpen);
  const run = useRunStore((state) => state.run);
  const hitBoss = useRunStore((state) => state.hitBoss);
  const closeBoss = useRunStore((state) => state.closeBoss);
  const skillRuntime = useSkillsStore((state) => state.rt);
  const skillSpecs = useSkillsStore((state) => state.specs);
  const skillAggregates = useMemo(
    () => getSkillAggregates(),
    [skillRuntime, skillSpecs],
  );

  if (!bossOpen || !run) {
    return null;
  }

  const stage = run.stageIndex < run.stages.length ? run.stages[run.stageIndex] : null;
  if (!stage || stage.kind !== 'boss' || !stage.boss) {
    return null;
  }

  const boss = stage.boss;
  const bossName = t(`boss.enemies.${boss.id}`, { defaultValue: boss.name });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg rounded-3xl border border-white/50 bg-white/95 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t('boss.title')}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-plum-900 md:text-2xl">{bossName}</h3>
            <p className="mt-1 text-sm text-plum-600 md:text-base">{t('boss.instruction')}</p>
          </div>
          <button
            type="button"
            onClick={closeBoss}
            className="rounded-full border border-plum-200 bg-white/80 px-3 py-1 text-xs font-semibold text-plum-500 shadow-sm transition hover:border-plum-300 hover:text-plum-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 md:text-sm"
            aria-label={t('action.close')}
          >
            {t('action.close')}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm text-plum-500 md:text-base">
            <span>{t('boss.hp')}</span>
            <span className="font-semibold text-plum-800">
              {fmt(boss.hp)} / {fmt(boss.maxHp)}
            </span>
          </div>
          <Progress value={boss.hp} max={boss.maxHp} />
          <div className="flex items-center justify-between rounded-2xl border border-plum-100 bg-white/70 px-4 py-2 text-sm text-plum-600 shadow-sm md:text-base">
            <span>
              {t('boss.clickPower')}:{' '}
              {fmt(run.clickPower * (run.tempMods.clickMult ?? 1) * skillAggregates.clickMult)}
            </span>
            <span>
              {t('boss.reward')}: {fmt(boss.rewardHappy)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={hitBoss}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-plum-400 via-plum-500 to-plum-600 px-4 py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 md:text-lg"
          aria-label={t('action.attack')}
        >
          {t('action.attack')}
        </button>
      </motion.div>
    </div>
  );
}
