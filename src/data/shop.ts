import type { Upgrade } from '../types';

export function priceOf(base: number, owned: number): number {
  const price = Math.floor(base * Math.pow(1.15, owned));
  return Math.max(price, base);
}

export const SHOP: Upgrade[] = [
  {
    id: 'soft_brush',
    name: 'ふわふわブラシ',
    description: 'なで力が少し上がる。',
    type: 'click',
    basePrice: 15,
    gain: 0.5,
  },
  {
    id: 'warm_milk',
    name: 'あったかミルク',
    description: 'PPS が少し上がる。',
    type: 'pps',
    basePrice: 20,
    gain: 0.3,
  },
  {
    id: 'plush_cushion',
    name: 'ふかふかクッション',
    description: 'なで力がさらに上がる。',
    type: 'click',
    basePrice: 120,
    gain: 1.2,
  },
  {
    id: 'sunny_window',
    name: '日向ぼっこスポット',
    description: 'PPS が大幅アップ。',
    type: 'pps',
    basePrice: 250,
    gain: 1.0,
  },
  {
    id: 'catnip_field',
    name: 'キャットニップ畑',
    description: 'PPS をぐっと押し上げる。',
    type: 'pps',
    basePrice: 1200,
    gain: 4,
  },
  {
    id: 'royal_groomer',
    name: '王室仕込みのグルーマー',
    description: 'なで力が大きく上昇。',
    type: 'click',
    basePrice: 5000,
    gain: 7,
  },
];
