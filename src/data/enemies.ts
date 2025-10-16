import type { Enemy } from '../store/types';
import { createRng, normalizedSeedFrom } from '../lib/rng';

type EnemyTemplate = {
  id: string;
  name: string;
  baseHp: number;
  rewardRatio: number;
};

const ENEMY_TEMPLATES: EnemyTemplate[] = [
  { id: 'forest_guardian', name: 'Forest Guardian', baseHp: 1_200, rewardRatio: 0.35 },
  { id: 'clockwork_cat', name: 'Clockwork Cat', baseHp: 1_600, rewardRatio: 0.32 },
  { id: 'shadow_pouncer', name: 'Shadow Pouncer', baseHp: 2_000, rewardRatio: 0.4 },
  { id: 'crystal_lynx', name: 'Crystal Lynx', baseHp: 2_400, rewardRatio: 0.33 },
  { id: 'aurora_tiger', name: 'Aurora Tiger', baseHp: 3_000, rewardRatio: 0.36 },
];

export function pickEnemy(
  seed: number,
  difficultyIndex: number,
  scaling: number,
): Enemy {
  const rng = createRng(normalizedSeedFrom(seed, difficultyIndex));
  const template = ENEMY_TEMPLATES[rng.int(0, ENEMY_TEMPLATES.length - 1)];
  const variance = 0.85 + rng.next() * 0.3; // 0.85 - 1.15
  const maxHp = Math.floor(template.baseHp * scaling * variance);
  const rewardHappy = Math.floor(maxHp * template.rewardRatio);
  return {
    id: `${template.id}_${difficultyIndex}`,
    name: template.name,
    maxHp,
    hp: maxHp,
    rewardHappy,
  };
}
