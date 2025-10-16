import { createRng, normalizedSeedFrom, shuffleInPlace } from '../lib/rng';
import type { Stage } from '../store/types';
import { allRewardCardIds } from './cards';
import { pickEnemy } from './enemies';

const STAGE_PATTERN: Array<'goal' | 'boss'> = ['goal', 'goal', 'boss', 'goal', 'boss'];

const GOAL_STAGE_NAMES = ['Whisker Woods', 'Moonlit Hill', 'Bell Path', 'Starfall Lake', 'Dream Tower'];
const BOSS_STAGE_NAMES = ['Guardian Gate', 'Clockwork Bastion', 'Shadow Gallery', 'Crystal Summit', 'Aurora Throne'];

const REWARD_POOL_SIZE = 6;

export function generateStages(seed: number, baseClick: number, basePps: number): Stage[] {
  const rng = createRng(seed);
  const baseGoal =
    Math.max(baseClick * 40 + basePps * 90, 250) * (0.9 + rng.next() * 0.2);

  const rewardIds = allRewardCardIds();

  let goalCount = 0;
  let bossCount = 0;
  let previousGoal = baseGoal;

  return STAGE_PATTERN.map((kind, index) => {
    const rewardPool = makeRewardPool(seed, index, rewardIds);

    if (kind === 'goal') {
      const multiplier = Math.pow(1.8, goalCount);
      const goalHappy = Math.floor(baseGoal * multiplier);
      previousGoal = goalHappy;
      const stage: Stage = {
        id: `goal_${goalCount}`,
        name: GOAL_STAGE_NAMES[goalCount % GOAL_STAGE_NAMES.length],
        kind: 'goal',
        goalHappy,
        rewardPool,
      };
      goalCount += 1;
      return stage;
    }

    const scaling = Math.max(1, previousGoal / 900 + bossCount * 0.6 + 1);
    const boss = pickEnemy(seed, bossCount, scaling);
    const stage: Stage = {
      id: `boss_${bossCount}`,
      name: BOSS_STAGE_NAMES[bossCount % BOSS_STAGE_NAMES.length],
      kind: 'boss',
      boss,
      rewardPool,
    };
    bossCount += 1;
    return stage;
  });
}

function makeRewardPool(seed: number, stageIndex: number, ids: string[]): string[] {
  const pool = [...ids];
  const poolRng = createRng(normalizedSeedFrom(seed, stageIndex, 0x9e3779b9));
  shuffleInPlace(poolRng, pool);
  return pool.slice(0, Math.min(REWARD_POOL_SIZE, pool.length));
}
