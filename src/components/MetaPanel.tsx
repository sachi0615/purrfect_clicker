import { useMetaStore } from '../store/meta';

export function MetaPanel() {
  const meta = useMetaStore((state) => state.meta);

  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur">
      <h2 className="text-lg font-semibold text-plum-800">Meta Progress (Coming Soon)</h2>
      <p className="mt-1 text-sm text-plum-600">
        Spend cat souls here once permanent upgrades are available. For now this panel only tracks
        your current total.
      </p>
      <div className="mt-3 rounded-2xl border border-plum-100 bg-plum-50/60 p-4 text-2xl font-bold text-plum-700">
        {meta.catSouls} Souls
      </div>
      <div className="mt-4 space-y-2 text-sm text-plum-500">
        <p>Upgrade details will be added in a future update.</p>
        <p>Keep clearing runs to hoard more souls in the meantime!</p>
      </div>
    </div>
  );
}
