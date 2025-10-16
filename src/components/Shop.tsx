import { useState } from 'react';

import { SHOP, priceOf } from '../data/shop';
import { useGameStore } from '../store';
import type { UpgradeType } from '../types';
import { fmt } from '../util';

const SHOP_TABS: ReadonlyArray<{ id: UpgradeType; label: string }> = [
  { id: 'pps', label: '自動収入' },
  { id: 'click', label: 'なで力' },
];

const Shop = () => {
  const happy = useGameStore((state) => state.happy);
  const upgrades = useGameStore((state) => state.upgrades);
  const buy = useGameStore((state) => state.buy);
  const [activeTab, setActiveTab] = useState<UpgradeType>('pps');
  const filteredItems = SHOP.filter((item) => item.type === activeTab);

  return (
    <div className="shop">
      <h2>ショップ</h2>
      <div className="shop-tabs">
        {SHOP_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`shop-tab${tab.id === activeTab ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <ul className="shop-list">
        {filteredItems.map((item) => {
          const owned = upgrades[item.id] ?? 0;
          const price = priceOf(item.basePrice, owned);
          const affordable = happy >= price;

          return (
            <li key={item.id} className="shop-item">
              <div className="shop-item-header">
                <div>
                  <span className="shop-item-title">{item.name}</span>
                  <span className="shop-item-type">
                    {item.type === 'click' ? 'なで力 +' : 'PPS +'}
                    {item.gain}
                  </span>
                </div>
                <span className="shop-item-owned">所持数 {owned}</span>
              </div>
              <p className="shop-item-desc">{item.description}</p>
              <div className="shop-item-footer">
                <span className="shop-price">価格: {fmt(price)}</span>
                <button
                  className="buy-button"
                  onClick={() => buy(item.id)}
                  disabled={!affordable}
                >
                  購入
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Shop;
