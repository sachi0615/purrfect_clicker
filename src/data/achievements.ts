import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_pet',
    name: 'はじめのなで',
    description: '合計 10 回なでました。',
    metric: 'totalPets',
    threshold: 10,
  },
  {
    id: 'pet_pro',
    name: 'なでマスター',
    description: '合計 1,000 回なでました。',
    metric: 'totalPets',
    threshold: 1_000,
  },
  {
    id: 'happy_1k',
    name: '幸せいっぱい',
    description: 'ハッピーを 1,000 集めました。',
    metric: 'happy',
    threshold: 1_000,
  },
  {
    id: 'pps_10',
    name: '自動化の芽',
    description: '毎秒ハッピーが 10 を超えました。',
    metric: 'pps',
    threshold: 10,
  },
  {
    id: 'level_5',
    name: '成長する手つき',
    description: 'プレイヤーレベル 5 に到達しました。',
    metric: 'level',
    threshold: 5,
  },
  {
    id: 'happy_1m',
    name: '伝説の癒し手',
    description: 'ハッピーを 1,000,000 集めました。',
    metric: 'happy',
    threshold: 1_000_000,
  },
];
