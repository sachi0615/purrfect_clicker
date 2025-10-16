import { fmt } from '../lib/format';
import { useRunStore } from '../store/run';

const labels = [
  { key: 'happy', label: 'Happy' },
  { key: 'click', label: 'Click' },
  { key: 'pps', label: 'PPS' },
  { key: 'pets', label: 'Total Pets' },
  { key: 'stage', label: 'Stage' },
  { key: 'seed', label: 'Seed' },
];

export function TopPills() {
  const run = useRunStore((state) => state.run);
  if (!run) {
    return null;
  }
  const currentStage = Math.min(run.stageIndex + 1, run.stages.length);
  const display = {
    happy: fmt(run.happy),
    click: fmt(run.clickPower * (run.tempMods.clickMult ?? 1)),
    pps: fmt(run.pps * (run.tempMods.ppsMult ?? 1)),
    pets: fmt(run.totalPets),
    stage: `${currentStage}/${run.stages.length}`,
    seed: String(run.seed),
  };

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      {labels.map((pill) => (
        <div
          key={pill.key}
          className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
        >
          <div className="text-xs uppercase tracking-wide text-plum-500">{pill.label}</div>
          <div className="mt-1 text-lg font-semibold text-plum-900">{display[pill.key as keyof typeof display]}</div>
        </div>
      ))}
    </div>
  );
}
