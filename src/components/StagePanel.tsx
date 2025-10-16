import { fmt } from '../lib/format';
import { useRunStore } from '../store/run';

export function StagePanel() {
  const run = useRunStore((state) => state.run);
  const openBoss = useRunStore((state) => state.openBoss);
  const finishRun = useRunStore((state) => state.finishRun);

  if (!run) {
    return null;
  }

  const stage = run.stageIndex < run.stages.length ? run.stages[run.stageIndex] : null;

  if (!stage) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-plum-800">All stages cleared!</h2>
        <p className="mt-2 text-sm text-plum-600">Check the run summary to review your rewards.</p>
      </div>
    );
  }

  const isGoal = stage.kind === 'goal';
  const goalValue = stage.goalHappy ?? 0;
  const progress = isGoal && goalValue > 0 ? Math.min(run.happy / goalValue, 1) : 0;

  return (
    <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-plum-800">{stage.name}</h2>
          <p className="text-sm text-plum-500">
            {isGoal
              ? 'Gather Happy to reach the stage goal and earn a reward card.'
              : 'Defeat the boss to advance to the next stage.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => finishRun('abandon')}
          className="rounded-full border border-plum-200 px-3 py-1 text-xs font-semibold text-plum-500 transition hover:border-plum-400 hover:text-plum-700"
        >
          End Run (Rebirth)
        </button>
      </div>

      {isGoal ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-plum-600">
            <span>Goal: {fmt(goalValue)}</span>
            <span>
              {fmt(run.happy)} / {fmt(goalValue)}
            </span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-plum-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-plum-400 to-plum-600 transition-all"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {stage.boss ? (
            <>
              <div className="text-sm text-plum-600">
                Boss HP: {fmt(stage.boss.hp)} / {fmt(stage.boss.maxHp)} — reward {fmt(stage.boss.rewardHappy)} Happy
              </div>
              <div className="h-3 rounded-full bg-plum-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-plum-500 to-plum-700 transition-all"
                  style={{
                    width: `${Math.max(0, Math.min((stage.boss.hp / stage.boss.maxHp) * 100, 100))}%`,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={openBoss}
                className="self-start rounded-full bg-plum-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-plum-700"
              >
                Enter Boss Fight
              </button>
            </>
          ) : (
            <p className="text-sm text-plum-600">Boss data is missing for this stage.</p>
          )}
        </div>
      )}
    </div>
  );
}
