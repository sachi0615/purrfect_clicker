import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_pet',
    name: 'はじめてのなでなで',
    description: '合計なで回数が 10 に到達。',
    metric: 'totalPets',
    threshold: 10,
  },
  {
    id: 'happy_100',
    name: 'ハッピー100',
    description: 'ハッピーが 100 に到達。',
    metric: 'happy',
    threshold: 100,
  },
  {
    id: 'pps_one',
    name: 'ごきげんスピード',
    description: 'PPS が 1 を突破。',
    metric: 'pps',
    threshold: 1,
  },
  {
    id: 'level_five',
    name: 'ねこ親善大使',
    description: 'レベル 5 に到達。',
    metric: 'level',
    threshold: 5,
  },
  {
    id: 'happy_million',
    name: 'ハッピー長者',
    description: 'ハッピーが 1,000,000 に到達。',
    metric: 'happy',
    threshold: 1_000_000,
  },
];
