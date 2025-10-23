import type { Enemy, EnemySpecial, RewardTier } from '../store/types';
import { createRng, normalizedSeedFrom } from '../lib/rng';

type EnemyRole = 'minion' | 'boss';

type EnemyTemplate = {
  id: string;
  name: string;
  baseHp: number;
  rewardRatio: number;
};

const MINION_TEMPLATES: EnemyTemplate[] = [
  { id: 'forest_guardian', name: 'Forest Guardian', baseHp: 420, rewardRatio: 0.18 },
  { id: 'clockwork_cat', name: 'Clockwork Cat', baseHp: 560, rewardRatio: 0.2 },
  { id: 'shadow_pouncer', name: 'Shadow Pouncer', baseHp: 680, rewardRatio: 0.22 },
  { id: 'crystal_lynx', name: 'Crystal Lynx', baseHp: 820, rewardRatio: 0.21 },
  { id: 'aurora_tiger', name: 'Aurora Tiger', baseHp: 940, rewardRatio: 0.23 },
];

const BOSS_TEMPLATES: EnemyTemplate[] = [
  { id: 'guardian_gate', name: 'Guardian Gatekeeper', baseHp: 4_200, rewardRatio: 0.4 },
  { id: 'clockwork_bastion', name: 'Clockwork Bastion Prime', baseHp: 4_800, rewardRatio: 0.42 },
  { id: 'shadow_gallery', name: 'Shadow Gallery Maestro', baseHp: 5_400, rewardRatio: 0.45 },
  { id: 'crystal_summit', name: 'Crystal Summit Tyrant', baseHp: 5_900, rewardRatio: 0.44 },
  { id: 'aurora_throne', name: 'Aurora Throne Sovereign', baseHp: 6_400, rewardRatio: 0.46 },
];

export function pickEnemy(
  seed: number,
  stageOrder: number,
  encounterIndex: number,
  role: EnemyRole,
  scaling: number,
): Enemy {
  const rng = createRng(
    normalizedSeedFrom(seed, stageOrder, encounterIndex, role === 'boss' ? 0xff : 0x00),
  );
  const templates = role === 'boss' ? BOSS_TEMPLATES : MINION_TEMPLATES;
  const template = templates[rng.int(0, templates.length - 1)];
  const variance = 0.9 + rng.next() * 0.25; // 0.9 - 1.15
  const maxHp = Math.floor(template.baseHp * scaling * variance);
  const rewardHappy = Math.floor(maxHp * template.rewardRatio);
  const rewardTier: RewardTier = role === 'boss' ? 'boss' : 'standard';
  const specials =
    role === 'boss' ? createBossSpecials(template.id, stageOrder, rng) : ([] as EnemySpecial[]);
  const timeLimitSec =
    role === 'boss'
      ? Math.max(35, Math.floor(60 - stageOrder * 4 + rng.int(-2, 2)))
      : undefined;

  return {
    id: `${template.id}_${stageOrder}_${encounterIndex}`,
    name: template.name,
    maxHp,
    hp: maxHp,
    rewardHappy,
    rewardTier,
    role: role === 'boss' ? 'boss' : 'normal',
    damageTakenMult: 1,
    specials: specials.length ? specials : undefined,
    timeLimitSec,
    baseMaxHp: maxHp,
    baseRewardHappy: rewardHappy,
  };
}

function createBossSpecials(
  templateId: string,
  stageOrder: number,
  rng: ReturnType<typeof createRng>,
): EnemySpecial[] {
  const specials: EnemySpecial[] = [];
  if (stageOrder >= 1) {
    const cooldown = Math.max(8, 16 - stageOrder * 2 + rng.int(-1, 1));
    const duration = Math.min(8, 4 + stageOrder);
    const magnitude = Math.max(0.45, 0.7 - stageOrder * 0.05);
    specials.push({
      id: `${templateId}.barrier`,
      type: 'barrier',
      cooldown,
      duration,
      magnitude,
    });
  }
  if (stageOrder >= 2) {
    const cooldown = Math.max(10, 18 - stageOrder * 2 + rng.int(-1, 1));
    const magnitude = Math.min(0.16, 0.08 + stageOrder * 0.02);
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
