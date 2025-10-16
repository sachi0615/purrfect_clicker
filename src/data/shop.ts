import type { Upgrade } from '../types';

export function priceOf(base: number, owned: number): number {
  const scaled = base * Math.pow(1.15, owned);
  return Math.max(base, Math.floor(scaled));
}

export const SHOP: Upgrade[] = [
  {
    id: 'feather_wand',
    name: '羽根じゃらし',
    description: 'なで力が少し上がります。',
    type: 'click',
    basePrice: 25,
    gain: 0.6,
  },
  {
    id: 'warm_milk',
    name: 'あったかミルク',
    description: '毎秒のハッピーがゆっくり増えます。',
    type: 'pps',
    basePrice: 30,
    gain: 0.4,
  },
  {
    id: 'plush_cushion',
    name: 'ふわふわクッション',
    description: 'なで力がさらに上がります。',
    type: 'click',
    basePrice: 120,
    gain: 1.5,
  },
  {
    id: 'knit_blanket',
    name: '編み込み毛布',
    description: 'PPS がしっかり上昇します。',
    type: 'pps',
    basePrice: 260,
    gain: 1.2,
  },
  {
    id: 'royal_groomer',
    name: '王室グルーミング',
    description: 'なで力が大きく伸びます。',
    type: 'click',
    basePrice: 1200,
    gain: 5,
  },
  {
    id: 'sunny_window',
    name: '陽だまりの窓辺',
    description: 'PPS がぐっと増えます。',
    type: 'pps',
    basePrice: 3200,
    gain: 6,
  },
  {
    id: 'starlight_gloves',
    name: '星明かりの手袋',
    description: 'なで力がとても上がります。',
    type: 'click',
    basePrice: 15000,
    gain: 18,
  },
  {
    id: 'dream_machine',
    name: '夢見マシン',
    description: 'PPS が爆発的に増えます。',
    type: 'pps',
    basePrice: 55000,
    gain: 30,
  },
];
