import { Swords, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { fmt } from '../lib/format';
import type { Enemy } from '../store/types';
import { Progress } from './Progress';
import { Section } from './Section';
import { useRunStore } from '../store/run';

export function StagePanel() {
  const { t } = useTranslation();
  const run = useRunStore((state) => state.run);
  const openBoss = useRunStore((state) => state.openBoss);
  const finishRun = useRunStore((state) => state.finishRun);

  if (!run) {
    return null;
  }

  const stage = run.stageIndex < run.stages.length ? run.stages[run.stageIndex] : null;

  if (!stage) {
    return (
      <Section
        title={t('stage.allCleared')}
        description={t('stage.summaryHint')}
        icon={<Target className="h-5 w-5" aria-hidden />}
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-plum-600 md:text-base">
          {t('stage.stagesCleared', { current: run.stages.length, total: run.stages.length })}
        </p>
      </Section>
    );
  }

  const totalStages = run.stages.length;
  const stageNumber = Math.min(run.stageIndex + 1, totalStages);
  const totalEnemies = stage.enemies.length;
  const enemiesCleared = Math.min(run.enemyIndex, totalEnemies);
  const currentEnemy =
    enemiesCleared < totalEnemies ? stage.enemies[run.enemyIndex] : null;
  const boss = stage.boss;
  const bossDefeated = boss.hp <= 0;
  const bossReady = !bossDefeated && enemiesCleared >= totalEnemies;
  const progressTarget = currentEnemy ?? boss;
  const progressLabel = currentEnemy ? t('stage.goalProgress') : t('boss.hp');
  const stageIcon = bossReady ? (
    <Swords className="h-5 w-5 text-plum-500" aria-hidden />
  ) : (
    <Target className="h-5 w-5 text-plum-500" aria-hidden />
  );
  const description = bossReady ? t('stage.bossHint') : t('stage.goalHint');
  const gameStageLabel = t('stage.gameStage', {
    defaultValue: 'Game Stage {{value}}',
    value: run.gameStage,
  });

  return (
    <Section
      title={t(`stage.names.${stage.id}`, { defaultValue: stage.name })}
      description={description}
      icon={stageIcon}
      action={
        <button
          type="button"
          onClick={() => finishRun('abandon')}
          className="rounded-full border border-plum-200 bg-white/80 px-4 py-2 text-xs font-semibold text-plum-600 shadow-sm transition hover:border-plum-300 hover:text-plum-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 md:text-sm"
          aria-label={t('action.reset')}
        >
          {t('action.reset')}
        </button>
      }
      className="flex h-full min-h-0 flex-col gap-4"
    >
      <div className="flex items-center justify-between text-xs text-plum-500 md:text-sm">
        <span>
          {t('stage.stagesCleared', {
            current: stageNumber,
            total: totalStages,
          })}
        </span>
        <span className="font-semibold text-plum-700">
          {t('stage.enemyCount', {
            current: Math.min(enemiesCleared, totalEnemies),
            total: totalEnemies,
            defaultValue: `Enemy ${Math.min(enemiesCleared, totalEnemies)}/${totalEnemies}`,
          })}
        </span>
      </div>

      <Progress value={progressTarget.hp} max={progressTarget.maxHp} label={progressLabel} />

      <EncounterDetails
        enemy={currentEnemy}
        enemiesCleared={enemiesCleared}
        totalEnemies={totalEnemies}
        bossDefeated={bossDefeated}
        bossReady={bossReady}
      />

      <BossDetails
        boss={boss}
        bossReady={bossReady}
        bossEngaged={run.bossEngaged}
        bossTimeLeft={run.bossTimeLeft}
        onOpen={openBoss}
      />

      <div className="rounded-2xl border border-plum-100 bg-white/70 px-4 py-2 text-xs font-semibold text-plum-600 shadow-sm md:text-sm">
        {gameStageLabel}
      </div>
    </Section>
  );
}

type EncounterDetailsProps = {
  enemy: Enemy | null;
  enemiesCleared: number;
  totalEnemies: number;
  bossDefeated: boolean;
  bossReady: boolean;
};

function EncounterDetails({
  enemy,
  enemiesCleared,
  totalEnemies,
  bossDefeated,
  bossReady,
}: EncounterDetailsProps) {
  const { t } = useTranslation();

  if (bossDefeated) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700 shadow-sm md:text-base">
        {t('stage.bossCleared', { defaultValue: 'Boss defeated!' })}
      </div>
    );
  }

  if (!enemy) {
    return (
      <div className="rounded-2xl border border-plum-100 bg-white/70 p-4 text-sm text-plum-600 shadow-sm md:text-base">
        {bossReady
          ? t('stage.bossReady', { defaultValue: 'The boss is ready. Prepare for the fight!' })
          : t('stage.goalHint')}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-plum-100 bg-white/70 p-4 text-sm text-plum-600 shadow-sm md:text-base">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <span className="font-semibold text-plum-800">
          {t(`boss.enemies.${enemy.id}`, { defaultValue: enemy.name })}
        </span>
        <span>
          {fmt(enemy.hp)} / {fmt(enemy.maxHp)}
        </span>
      </div>
      <p className="mt-2 text-xs text-plum-500 md:text-sm">
        {t('stage.enemyProgress', {
          current: enemiesCleared + 1,
          total: totalEnemies,
          defaultValue: `Enemy ${enemiesCleared + 1}/${totalEnemies}`,
        })}
      </p>
    </div>
  );
}

type BossDetailsProps = {
  boss: Enemy;
  bossReady: boolean;
  bossEngaged: boolean;
  bossTimeLeft: number | null;
  onOpen: () => void;
};

function BossDetails({ boss, bossReady, bossEngaged, bossTimeLeft, onOpen }: BossDetailsProps) {
  const { t } = useTranslation();

  if (!bossReady && boss.hp > 0) {
    return (
      <p className="text-sm text-plum-500 md:text-base">
        {t('stage.bossHint')}
      </p>
    );
  }

  if (boss.hp <= 0) {
    return null;
  }

  const timeLimit = boss.timeLimitSec ?? null;
  const effectiveTime = bossEngaged ? bossTimeLeft ?? timeLimit : timeLimit;
  const secondsLabel =
    effectiveTime !== null ? `${Math.max(0, Math.ceil(effectiveTime))}s` : null;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="rounded-2xl border border-plum-100 bg-white/70 px-4 py-2 text-sm text-plum-600 shadow-sm md:text-base">
        {t('stage.bossReward')}: <span className="font-semibold text-plum-800">{fmt(boss.rewardHappy)}</span>
      </div>
      {timeLimit !== null ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-2 text-sm text-amber-700 shadow-sm md:text-base">
          {t('boss.timeLimit', { defaultValue: 'Time limit' })}:{' '}
          <span className="font-semibold">{secondsLabel ?? '--'}</span>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center justify-center rounded-full bg-plum-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 md:text-base"
        aria-label={t('action.boss')}
      >
        {bossEngaged
          ? t('action.resume', { defaultValue: t('action.boss') })
          : t('action.boss')}
      </button>
    </div>
  );
}

