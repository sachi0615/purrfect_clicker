import { getRewardCard } from '../data/cards';
import { useRunStore } from '../store/run';

export function RewardPicker() {
  const showReward = useRunStore((state) => state.showReward);
  const rewardChoices = useRunStore((state) => state.rewardChoices);
  const applyReward = useRunStore((state) => state.applyReward);

  if (!showReward) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur">
      <div className="w-full max-w-3xl rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-plum-800">Choose a Reward Card</h3>
        <p className="mt-1 text-sm text-plum-500">
          These effects last for the rest of the run. Pick the bonus that best matches your build.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {rewardChoices.map((id) => {
            const card = getRewardCard(id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => applyReward(card.id)}
                className="flex h-full flex-col items-start gap-2 rounded-2xl border border-plum-200 bg-plum-50/70 p-4 text-left shadow transition hover:-translate-y-1 hover:border-plum-400 hover:bg-white"
              >
                <span className="text-sm font-semibold uppercase tracking-wide text-plum-500">
                  {card.id}
                </span>
                <span className="text-lg font-semibold text-plum-800">{card.name}</span>
                <span className="text-sm text-plum-600">{card.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
