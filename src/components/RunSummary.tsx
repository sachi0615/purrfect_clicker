import { getRewardCard } from '../data/cards';
import { fmt } from '../lib/format';
import { useMetaStore } from '../store/meta';
import { useRunStore } from '../store/run';

export function RunSummary() {
  const showSummary = useRunStore((state) => state.showSummary);
  const summary = useRunStore((state) => state.summary);
  const newRun = useRunStore((state) => state.newRun);
  const resetUi = useRunStore((state) => state.resetUi);
  const catSouls = useMetaStore((state) => state.meta.catSouls);

  if (!showSummary || !summary) {
    return null;
  }

  const cards = summary.cards.map((id) => getRewardCard(id));

  const handleRestart = () => {
    resetUi();
    newRun();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur">
      <div className="w-full max-w-2xl rounded-3xl border border-white/40 bg-white/95 p-6 shadow-2xl">
        <h3 className="text-2xl font-semibold text-plum-800">
          {summary.cleared ? 'Run Cleared!' : 'Run Finished'}
        </h3>
        <div className="mt-4 grid gap-4 rounded-2xl border border-plum-100 bg-plum-50/60 p-4 md:grid-cols-2">
          <SummaryItem label="Total Happy" value={`${fmt(summary.totalHappy)} Happy`} />
          <SummaryItem
            label="Stages Reached"
            value={`${summary.stagesCleared}/${summary.totalStages}`}
          />
          <SummaryItem label="Seed" value={summary.seed} />
          <SummaryItem label="Total Cat Souls" value={`${catSouls} Souls`} />
        </div>
        <div className="mt-6">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-plum-500">
            Selected Cards
          </h4>
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            {cards.length === 0 ? (
              <li className="rounded-xl border border-plum-100 bg-white/80 p-3 text-sm text-plum-500">
                No cards were selected this run.
              </li>
            ) : (
              cards.map((card) => (
                <li
                  key={card.id}
                  className="rounded-xl border border-plum-150 bg-white/80 p-3 text-sm text-plum-600"
                >
                  <div className="text-xs uppercase text-plum-400">{card.id}</div>
                  <div className="text-base font-semibold text-plum-800">{card.name}</div>
                  <div>{card.desc}</div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-full bg-gradient-to-r from-plum-400 to-plum-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01]"
          >
            Start New Run
          </button>
        </div>
      </div>
    </div>
  );
}

type SummaryItemProps = {
  label: string;
  value: string | number;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="rounded-xl border border-plum-100 bg-white/80 p-3 text-sm text-plum-600">
      <div className="text-xs uppercase tracking-wide text-plum-400">{label}</div>
      <div className="text-lg font-semibold text-plum-800">{value}</div>
    </div>
  );
}
