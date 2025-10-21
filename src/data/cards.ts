import { getBuildBonus, listBuildBonuses } from './builds';
import type { RewardCard, RewardCardId } from '../store/types';

export const REWARD_CARDS: RewardCard[] = listBuildBonuses().map((bonus) => ({
  id: bonus.id,
  bonusId: bonus.id,
  archetype: bonus.archetype,
  tier: bonus.tier,
}));

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
