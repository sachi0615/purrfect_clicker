import type { Enemy, EnemySpecial } from '../store/types';
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
  loop: number,
  scaling: number,
): Enemy {
  const rng = createRng(normalizedSeedFrom(seed, difficultyIndex));
  const template = ENEMY_TEMPLATES[rng.int(0, ENEMY_TEMPLATES.length - 1)];
  const variance = 0.85 + rng.next() * 0.3; // 0.85 - 1.15
  const maxHp = Math.floor(template.baseHp * scaling * variance);
  const rewardHappy = Math.floor(maxHp * template.rewardRatio);
  const specials = createSpecials(template.id, loop, rng);
  return {
    id: `${template.id}_${difficultyIndex}`,
    name: template.name,
    maxHp,
    hp: maxHp,
    rewardHappy,
    damageTakenMult: 1,
    specials: specials.length ? specials : undefined,
  };
}

function createSpecials(
  templateId: string,
  loop: number,
  rng: ReturnType<typeof createRng>,
): EnemySpecial[] {
  const specials: EnemySpecial[] = [];
  if (loop >= 1) {
    const cooldown = Math.max(8, 14 - loop * 2);
    const duration = Math.min(7, 4 + loop);
    const magnitude = Math.max(0.45, 0.7 - loop * 0.08);
    specials.push({
      id: `${templateId}.barrier`,
      type: 'barrier',
      cooldown,
      duration,
      magnitude,
    });
  }
  if (loop >= 2) {
    const cooldown = Math.max(10, 18 - loop * 2);
    const magnitude = Math.min(0.16, 0.08 + loop * 0.02);
    specials.push({
      id: `${templateId}.drain`,
      type: 'drain',
      cooldown,
      duration: 0.5,
      magnitude,
    });
  }
  return specials;
}
