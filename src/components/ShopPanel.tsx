import { ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SHOP_ITEMS } from '../data/shopItems';
import { fmt } from '../lib/format';
import { Section } from './Section';
import { useRunStore } from '../store/run';

export function ShopPanel() {
  const { t } = useTranslation();
  const run = useRunStore((state) => state.run);
  const buy = useRunStore((state) => state.buyShopItem);
  const shopLevels = useRunStore((state) => state.shopLevels);

  if (!run) {
    return null;
  }

  return (
    <Section
      title={t('shop.title')}
      description={t('shop.helper')}
      icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between text-sm text-plum-600 md:text-base">
        <span>{t('pills.happy')}</span>
        <span className="font-semibold text-plum-800">{fmt(run.happy)}</span>
      </div>
      <ul className="flex flex-col gap-4">
        {SHOP_ITEMS.map((item) => {
          const name = t(`shop.items.${item.id}.name`, { defaultValue: item.name });
          const description = t(`shop.items.${item.id}.desc`, { defaultValue: item.description });
          const owned = shopLevels[item.id] ?? 0;
          const discount = Math.max(run.tempMods.shopDiscount ?? 1, 0.4);
          const price = Math.ceil(item.basePrice * Math.pow(item.growth, owned) * discount);
          const affordable = run.happy >= price && run.alive;
          const discounted = discount < 0.999;
          return (
            <li
              key={item.id}
              className="rounded-2xl border border-plum-100 bg-plum-50/60 p-4 shadow-sm md:p-5"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-plum-800 md:text-lg">{name}</p>
                  <p className="text-sm text-plum-600 md:text-base">{description}</p>
                  <p className="text-xs text-plum-500 md:text-sm">
                    {t('shop.owned')}: {owned}{' '}
                    <span className="mx-1 text-plum-300">|</span>
                    {t('shop.price')}: {fmt(price)}
                    {discounted ? (
                      <span className="ml-2 rounded-full bg-plum-200 px-2 py-0.5 text-xs font-semibold text-plum-700">
                        {t('shop.discount')}
                      </span>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => buy(item.id)}
                  disabled={!affordable}
                  className="inline-flex items-center justify-center rounded-full bg-plum-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-plum-200 disabled:text-plum-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
                  aria-label={`${t('shop.title')}: ${name}`}
                >
                  {t('action.buy')}
                </button>
              </div>
            </li>
          );
        })}
        {SHOP_ITEMS.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-plum-100 bg-white/80 p-4 text-sm text-plum-500 shadow-sm md:p-5">
            {t('shop.empty')}
          </li>
        ) : null}
      </ul>
    </Section>
  );
}
