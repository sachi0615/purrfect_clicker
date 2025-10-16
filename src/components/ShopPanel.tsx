import { SHOP_ITEMS } from '../data/shopItems';
import { fmt } from '../lib/format';
import { useRunStore } from '../store/run';

export function ShopPanel() {
  const run = useRunStore((state) => state.run);
  const buy = useRunStore((state) => state.buyShopItem);
  const shopLevels = useRunStore((state) => state.shopLevels);

  if (!run) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-plum-800">Run Shop</h2>
        <span className="text-sm text-plum-500">Happy: {fmt(run.happy)}</span>
      </div>
      <ul className="flex flex-col gap-3">
        {SHOP_ITEMS.map((item) => {
          const owned = shopLevels[item.id] ?? 0;
          const discount = Math.max(run.tempMods.shopDiscount ?? 1, 0.4);
          const price = Math.ceil(item.basePrice * Math.pow(item.growth, owned) * discount);
          const affordable = run.happy >= price && run.alive;
          return (
            <li
              key={item.id}
              className="rounded-2xl border border-plum-200/60 bg-plum-50/60 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-plum-800">{item.name}</div>
                  <div className="text-sm text-plum-600">{item.description}</div>
                  <div className="mt-1 text-xs text-plum-500">
                    Owned: {owned} | Price: {fmt(price)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => buy(item.id)}
                  disabled={!affordable}
                  className="rounded-full bg-plum-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-plum-200"
                >
                  Buy
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-plum-500">
        These upgrades last only for the current run. Combine them with reward cards to push
        further.
      </p>
    </div>
  );
}
