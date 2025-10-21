import { Swords, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { fmt } from '../lib/format';
import { cn } from '../lib/utils';
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

  const isGoal = stage.kind === 'goal';
  const goalValue = stage.goalHappy ?? 0;
  const progressValue = isGoal ? run.happy : stage.boss?.hp ?? 0;
  const progressMax = isGoal ? goalValue : stage.boss?.maxHp ?? 1;
  const stageName = t(`stage.names.${stage.id}`, { defaultValue: stage.name });

  return (
    <Section
      title={stageName}
      description={isGoal ? t('stage.goalHint') : t('stage.bossHint')}
      icon={
        isGoal ? (
          <Target className="h-5 w-5 text-plum-500" aria-hidden />
        ) : (
          <Swords className="h-5 w-5 text-plum-500" aria-hidden />
        )
      }
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
            current: Math.min(run.stageIndex + 1, run.stages.length),
            total: run.stages.length,
          })}
        </span>
        {isGoal ? (
          <span>
            {fmt(run.happy)} / {fmt(goalValue)}
          </span>
        ) : stage.boss ? (
          <span>
            {fmt(stage.boss.hp)} / {fmt(stage.boss.maxHp)}
          </span>
        ) : null}
      </div>

      <Progress
        value={progressValue}
        max={progressMax}
        label={isGoal ? t('stage.goalProgress') : t('boss.hp')}
      />

      {isGoal ? (
        <GoalDetails goalValue={goalValue} runHappy={run.happy} />
      ) : (
        <BossDetails
          onOpen={openBoss}
          reward={stage.boss?.rewardHappy ?? 0}
          active={Boolean(stage.boss)}
        />
      )}
    </Section>
  );
}

type GoalDetailsProps = {
  goalValue: number;
  runHappy: number;
};

function GoalDetails({ goalValue, runHappy }: GoalDetailsProps) {
  const { t } = useTranslation();
  const remaining = Math.max(0, goalValue - runHappy);

  return (
    <div className="rounded-2xl border border-plum-100 bg-white/70 p-4 text-sm text-plum-600 shadow-sm md:text-base">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <span>{t('stage.goalTitle')}</span>
        <span className="font-semibold text-plum-800">
          {t('stage.goalRemaining', { value: fmt(remaining) })}
        </span>
      </div>
    </div>
  );
}

type BossDetailsProps = {
  reward: number;
  active: boolean;
  onOpen: () => void;
};

function BossDetails({ reward, active, onOpen }: BossDetailsProps) {
  const { t } = useTranslation();

  if (!active) {
    return (
      <p className="text-sm text-plum-500 md:text-base">
        {t('stage.bossHint')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="rounded-2xl border border-plum-100 bg-white/70 px-4 py-2 text-sm text-plum-600 shadow-sm md:text-base">
        {t('stage.bossReward')}: <span className="font-semibold text-plum-800">{fmt(reward)}</span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center justify-center rounded-full bg-plum-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 md:text-base"
        aria-label={t('action.boss')}
      >
        {t('action.boss')}
      </button>
    </div>
  );
}
