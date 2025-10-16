import { fmt } from '../lib/format';
import { useRunStore } from '../store/run';

export function BossModal() {
  const bossOpen = useRunStore((state) => state.bossOpen);
  const run = useRunStore((state) => state.run);
  const hitBoss = useRunStore((state) => state.hitBoss);
  const closeBoss = useRunStore((state) => state.closeBoss);

  if (!bossOpen || !run) {
    return null;
  }

  const stage = run.stageIndex < run.stages.length ? run.stages[run.stageIndex] : null;
  if (!stage || stage.kind !== 'boss' || !stage.boss) {
    return null;
  }

  const progress = Math.max(0, Math.min(stage.boss.hp / stage.boss.maxHp, 1));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl border border-white/40 bg-white/95 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-plum-800">{stage.boss.name}</h3>
            <p className="text-sm text-plum-600">Reduce the boss HP to zero to clear the stage.</p>
          </div>
          <button
            type="button"
            onClick={closeBoss}
            className="rounded-full border border-plum-200 px-3 py-1 text-xs font-semibold text-plum-500 hover:border-plum-400 hover:text-plum-700"
          >
            Close
          </button>
        </div>
        <div className="mt-4 text-sm text-plum-600">
          HP: {fmt(stage.boss.hp)} / {fmt(stage.boss.maxHp)}
        </div>
        <div className="mt-2 h-4 rounded-full bg-plum-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-plum-500 to-plum-700 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-plum-500">
          <span>Click power: {fmt(run.clickPower * (run.tempMods.clickMult ?? 1))}</span>
          <span>Reward: {fmt(stage.boss.rewardHappy)} Happy</span>
        </div>
        <button
          type="button"
          onClick={hitBoss}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-plum-400 to-plum-600 px-4 py-3 text-base font-semibold text-white shadow-lg transition hover:scale-[1.01]"
        >
          Attack!
        </button>
      </div>
    </div>
  );
}
