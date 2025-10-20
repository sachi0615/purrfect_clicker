import { createRng, normalizedSeedFrom, shuffleInPlace } from '../lib/rng';
import type { Stage } from '../store/types';
import { allRewardCardIds } from './cards';
import { pickEnemy } from './enemies';

type StageKind = 'goal' | 'boss';

type StagePattern = {
  id: string;
  sequence: StageKind[];
  weight: number;
  minLoop?: number;
};

const LOOP_BASE_COUNT = 3;
const LOOP_VARIANCE = 2;

const GOAL_STAGE_NAMES = [
  'Whisker Woods',
  'Moonlit Hill',
  'Bell Path',
  'Starfall Lake',
  'Dream Tower',
];
const BOSS_STAGE_NAMES = [
  'Guardian Gate',
  'Clockwork Bastion',
  'Shadow Gallery',
  'Crystal Summit',
  'Aurora Throne',
];

const GOAL_LOOP_SCALING = 1.6;
const GOAL_WITHIN_LOOP_SCALING = 1.3;
const GOAL_GLOBAL_PROGRESS_SCALING = 1.18;
const MIN_BASE_GOAL = 250;

const BOSS_BASE_DIVISOR = 720;
const BOSS_LOOP_BONUS = 0.45;
const BOSS_ORDER_BONUS = 0.2;

const REWARD_POOL_BASE = 5;
const REWARD_POOL_MAX = 8;

const STAGE_PATTERNS: StagePattern[] = [
  { id: 'classic', sequence: ['goal', 'goal', 'boss'], weight: 3 },
  { id: 'longBuild', sequence: ['goal', 'goal', 'goal', 'boss'], weight: 2 },
  { id: 'goalBossGoal', sequence: ['goal', 'boss', 'goal'], weight: 2, minLoop: 1 },
  { id: 'bossBookend', sequence: ['goal', 'goal', 'boss', 'goal'], weight: 1, minLoop: 1 },
  { id: 'doubleBoss', sequence: ['goal', 'boss', 'goal', 'boss'], weight: 1, minLoop: 2 },
];

export function generateStages(seed: number, baseClick: number, basePps: number): Stage[] {
  const rng = createRng(seed);
  const rewardIds = allRewardCardIds();

  const loops = LOOP_BASE_COUNT + rng.int(0, LOOP_VARIANCE);
  const baseGoal =
    Math.max(baseClick * 40 + basePps * 90, MIN_BASE_GOAL) * (0.9 + rng.next() * 0.2);

  const stages: Stage[] = [];
  let globalStageIndex = 0;
  let goalCount = 0;
  let bossCount = 0;
  let previousGoal = baseGoal;

  for (let loop = 0; loop < loops; loop += 1) {
    const pattern = pickPattern(rng, loop);
    let goalsThisLoop = 0;

    pattern.forEach((kind, order) => {
      const rewardPoolSize = Math.min(REWARD_POOL_BASE + loop, REWARD_POOL_MAX);
      const rewardPool = makeRewardPool(seed, globalStageIndex, rewardIds, rewardPoolSize);

      if (kind === 'goal') {
        const loopMultiplier = Math.pow(GOAL_LOOP_SCALING, loop);
        const withinLoopMultiplier = Math.pow(GOAL_WITHIN_LOOP_SCALING, goalsThisLoop);
        const globalProgressMultiplier = Math.pow(GOAL_GLOBAL_PROGRESS_SCALING, goalCount);
        const goalHappy = Math.floor(
          baseGoal * loopMultiplier * withinLoopMultiplier * globalProgressMultiplier,
        );
        previousGoal = goalHappy;

        const stage: Stage = {
          id: `goal_${goalCount}`,
          name: formatLoopedName(
            GOAL_STAGE_NAMES[(goalCount + loop) % GOAL_STAGE_NAMES.length],
            loop,
          ),
          kind: 'goal',
          goalHappy,
          rewardPool,
          loop,
          order,
        };

        stages.push(stage);
        goalCount += 1;
        goalsThisLoop += 1;
      } else {
        const scalingBase = Math.max(1, previousGoal / BOSS_BASE_DIVISOR);
        const loopBonus = 1 + loop * BOSS_LOOP_BONUS;
        const orderBonus = 1 + order * BOSS_ORDER_BONUS;
        const scaling = scalingBase * loopBonus * orderBonus;
        const boss = pickEnemy(seed, bossCount, scaling);

        const stage: Stage = {
          id: `boss_${bossCount}`,
          name: formatLoopedName(
            BOSS_STAGE_NAMES[(bossCount + loop) % BOSS_STAGE_NAMES.length],
            loop,
          ),
          kind: 'boss',
          boss,
          rewardPool,
          loop,
          order,
        };

        stages.push(stage);
        bossCount += 1;
      }

      globalStageIndex += 1;
    });
  }

  return stages;
}

function pickPattern(rng: ReturnType<typeof createRng>, loop: number): StageKind[] {
  const candidates = STAGE_PATTERNS.filter(
    (pattern) => (pattern.minLoop ?? 0) <= loop,
  );
  const totalWeight = candidates.reduce((sum, pattern) => sum + pattern.weight, 0);
  let roll = rng.next() * totalWeight;
  for (const pattern of candidates) {
    roll -= pattern.weight;
    if (roll <= 0) {
      return pattern.sequence;
    }
  }
  return candidates[candidates.length - 1]?.sequence ?? ['goal', 'goal', 'boss'];
}

function makeRewardPool(
  seed: number,
  stageIndex: number,
  ids: string[],
  desiredSize: number,
): string[] {
  const pool = [...ids];
  const poolRng = createRng(normalizedSeedFrom(seed, stageIndex, 0x9e3779b9));
  shuffleInPlace(poolRng, pool);
  return pool.slice(0, Math.min(desiredSize, pool.length));
}

function formatLoopedName(base: string, loop: number): string {
  if (loop === 0) {
    return base;
  }
  return `${base} ${toRoman(loop + 1)}`;
}

function toRoman(value: number): string {
  if (value <= 0) {
    return `${value}`;
  }
  const numerals: Array<[number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remaining = value;
  let result = '';
  for (const [amount, symbol] of numerals) {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
    if (remaining === 0) {
      break;
    }
  }
  return result;
}
