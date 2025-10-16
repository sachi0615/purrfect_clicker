export type ShopItemType = 'click' | 'pps';

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  basePrice: number;
  growth: number;
  gain: number;
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'soft_brush',
    name: 'Soft Brush',
    description: 'Increase click power by +0.5.',
    type: 'click',
    basePrice: 30,
    growth: 1.35,
    gain: 0.5,
  },
  {
    id: 'treat_dispenser',
    name: 'Treat Dispenser',
    description: 'Increase passive income by +0.4.',
    type: 'pps',
    basePrice: 45,
    growth: 1.32,
    gain: 0.4,
  },
  {
    id: 'tower_upgrade',
    name: 'Tower Upgrade',
    description: 'Increase click power by +1.2.',
    type: 'click',
    basePrice: 120,
    growth: 1.4,
    gain: 1.2,
  },
  {
    id: 'auto_cleaner',
    name: 'Auto Cleaner',
    description: 'Increase passive income by +2.5.',
    type: 'pps',
    basePrice: 320,
    growth: 1.38,
    gain: 2.5,
  },
];

export const SHOP_ITEM_MAP = new Map(SHOP_ITEMS.map((item) => [item.id, item] as const));

export function getShopItem(itemId: string): ShopItem {
  const item = SHOP_ITEM_MAP.get(itemId);
  if (!item) {
    throw new Error(`Unknown shop item: ${itemId}`);
  }
  return item;
}
