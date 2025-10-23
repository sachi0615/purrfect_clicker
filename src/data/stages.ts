import { createRng, normalizedSeedFrom, shuffleInPlace } from '../lib/rng';
import type { Stage } from '../store/types';
import { rewardCardIdsByRarity } from './cards';
import { pickEnemy } from './enemies';

const STAGES_PER_RUN = 5;
const ENEMIES_PER_STAGE_MIN = 4;
const ENEMIES_PER_STAGE_MAX = 5;

const STAGE_NAMES = [
  'Whisker Woods',
  'Moonlit Hill',
  'Bell Path',
  'Starfall Lake',
  'Dream Tower',
];

const BASE_SCALING = 1.05;
const STAGE_SCALING_STEP = 0.4;
const ENCOUNTER_SCALING_STEP = 0.22;

const STANDARD_POOL_BASE = 6;
const STANDARD_POOL_GROWTH = 1;
const BOSS_POOL_SIZE = 4;

export function generateStages(seed: number, baseClick: number, basePps: number): Stage[] {
  const rng = createRng(seed);
  const stages: Stage[] = [];
  const baseMultiplier = computeBaseMultiplier(baseClick, basePps);

  const standardPoolIds = rewardCardIdsByRarity('standard');
  const bossPoolIds = rewardCardIdsByRarity('boss');

  for (let stageOrder = 0; stageOrder < STAGES_PER_RUN; stageOrder += 1) {
    const enemiesInStage =
      ENEMIES_PER_STAGE_MIN + rng.int(0, ENEMIES_PER_STAGE_MAX - ENEMIES_PER_STAGE_MIN);
    const stageScaling = baseMultiplier * (BASE_SCALING + stageOrder * STAGE_SCALING_STEP);
    const enemies = [];
    for (let enemyIndex = 0; enemyIndex < enemiesInStage; enemyIndex += 1) {
      const encounterScaling = stageScaling * (1 + enemyIndex * ENCOUNTER_SCALING_STEP);
      enemies.push(pickEnemy(seed, stageOrder, enemyIndex, 'minion', encounterScaling));
    }

    const bossScaling = stageScaling * (1 + enemiesInStage * ENCOUNTER_SCALING_STEP);
    const boss = pickEnemy(seed, stageOrder, enemiesInStage, 'boss', bossScaling);

    const standardPoolSize = STANDARD_POOL_BASE + stageOrder * STANDARD_POOL_GROWTH;
    const rewardPools = {
      standard: makeRewardPool(seed, stageOrder, standardPoolIds, standardPoolSize),
      boss: makeRewardPool(seed, 0x4000 + stageOrder, bossPoolIds, BOSS_POOL_SIZE),
    };

    stages.push({
      id: `stage_${stageOrder}`,
      name: STAGE_NAMES[stageOrder % STAGE_NAMES.length],
      order: stageOrder,
      difficulty: stageOrder + 1,
      enemies,
      boss,
      rewardPools,
    });
  }

  return stages;
}

function computeBaseMultiplier(baseClick: number, basePps: number): number {
  const clickFactor = Math.max(1, baseClick * 0.45);
  const ppsFactor = Math.max(1, basePps * 0.3);
  return Math.max(1, clickFactor + ppsFactor);
}

function makeRewardPool(
  seed: number,
  salt: number,
  ids: string[],
  desiredSize: number,
): string[] {
  const pool = [...ids];
  const poolRng = createRng(normalizedSeedFrom(seed, salt, 0x9e3779b9));
  shuffleInPlace(poolRng, pool);
  const size = Math.min(desiredSize, pool.length);
  return pool.slice(0, size);
}
