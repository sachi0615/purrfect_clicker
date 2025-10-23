import { getBuildBonus, listBuildBonuses } from './builds';
import type { RewardCard, RewardCardCategory, RewardCardId, RewardTier } from '../store/types';

const BOSS_MIN_TIER = 3;

function determineRarity(tier: number): RewardTier {
  return tier >= BOSS_MIN_TIER ? 'boss' : 'standard';
}

function determineCategory(keys: string[]): RewardCardCategory {
  if (keys.length === 0) {
    return 'stat';
  }
  if (keys.length > 1) {
    return 'hybrid';
  }
  const key = keys[0];
  if (
    key.includes('skill') ||
    key.includes('instant') ||
    key.includes('boss') ||
    key.includes('drain') ||
    key.includes('enemy')
  ) {
    return 'passive';
  }
  return 'stat';
}

export const REWARD_CARDS: RewardCard[] = listBuildBonuses().map((bonus) => {
  const effectKeys = Object.keys(bonus.effects ?? {});
  return {
    id: bonus.id,
    bonusId: bonus.id,
    archetype: bonus.archetype,
    tier: bonus.tier,
    rarity: determineRarity(bonus.tier),
    category: determineCategory(effectKeys),
  };
});

export const REWARD_CARD_MAP = new Map<RewardCardId, RewardCard>(
  REWARD_CARDS.map((card) => [card.id, card]),
);

export function getRewardCard(id: RewardCardId): RewardCard {
  const card = REWARD_CARD_MAP.get(id);
  if (!card) {
    throw new Error(`Unknown reward card: ${id}`);
  }
  return card;
}

export function getRewardBonus(id: RewardCardId) {
  const card = getRewardCard(id);
  return getBuildBonus(card.bonusId);
}

export function allRewardCardIds(): RewardCardId[] {
  return REWARD_CARDS.map((card) => card.id);
}

export function rewardCardIdsByRarity(rarity: RewardTier): RewardCardId[] {
  return REWARD_CARDS.filter((card) => card.rarity === rarity).map((card) => card.id);
}
