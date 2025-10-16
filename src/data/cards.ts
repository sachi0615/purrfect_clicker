import type { RewardCard, RewardCardId, TempMods } from '../store/types';

const multiply = (value: number | undefined, factor: number) => (value ?? 1) * factor;
const add = (value: number | undefined, delta: number) => (value ?? 0) + delta;

export const REWARD_CARDS: RewardCard[] = [
  {
    id: 'claw_training',
    name: 'Claw Training',
    desc: 'Increase click power by 50%.',
    apply: (mods: TempMods) => ({
      ...mods,
      clickMult: multiply(mods.clickMult, 1.5),
    }),
  },
  {
    id: 'sharp_reflex',
    name: 'Sharp Reflex',
    desc: 'Add +10% critical chance.',
    apply: (mods: TempMods) => ({
      ...mods,
      critChance: add(mods.critChance, 0.1),
    }),
  },
  {
    id: 'perfect_pounce',
    name: 'Perfect Pounce',
    desc: 'Boost critical multiplier by 25%.',
    apply: (mods: TempMods) => ({
      ...mods,
      critMult: multiply(mods.critMult ?? 2, 1.25),
    }),
  },
  {
    id: 'cozy_blanket',
    name: 'Cozy Blanket',
    desc: 'Increase passive income by 25%.',
    apply: (mods: TempMods) => ({
      ...mods,
      ppsMult: multiply(mods.ppsMult, 1.25),
    }),
  },
  {
    id: 'long_play',
    name: 'Long Play Session',
    desc: 'Extend skill duration by +3 seconds.',
    apply: (mods: TempMods) => ({
      ...mods,
      skillDurationPlus: add(mods.skillDurationPlus, 3),
    }),
  },
  {
    id: 'focused_spirit',
    name: 'Focused Spirit',
    desc: 'Reduce skill cooldown by 20%.',
    apply: (mods: TempMods) => ({
      ...mods,
      skillCdMult: multiply(mods.skillCdMult, 0.8),
    }),
  },
  {
    id: 'lucky_cache',
    name: 'Lucky Cache',
    desc: 'Gain a burst of Happy immediately.',
    apply: (mods: TempMods) => ({
      ...mods,
    }),
  },
  {
    id: 'boss_instinct',
    name: 'Boss Instinct',
    desc: 'Clicks deal 30% more damage during boss fights.',
    apply: (mods: TempMods) => ({
      ...mods,
      bossClickMult: multiply(mods.bossClickMult, 1.3),
    }),
  },
  {
    id: 'shoployalty',
    name: 'Shop Loyalty',
    desc: 'All shop prices are reduced by 10%.',
    apply: (mods: TempMods) => ({
      ...mods,
      shopDiscount: multiply(mods.shopDiscount ?? 1, 0.9),
    }),
  },
  {
    id: 'fast_paws',
    name: 'Fast Paws',
    desc: 'Increase click power by 20%.',
    apply: (mods: TempMods) => ({
      ...mods,
      clickMult: multiply(mods.clickMult, 1.2),
    }),
  },
  {
    id: 'steady_rhythm',
    name: 'Steady Rhythm',
    desc: 'Passive income +15% and click power +10%.',
    apply: (mods: TempMods) => ({
      ...mods,
      ppsMult: multiply(mods.ppsMult, 1.15),
      clickMult: multiply(mods.clickMult, 1.1),
    }),
  },
];

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

export function allRewardCardIds(): RewardCardId[] {
  return REWARD_CARDS.map((card) => card.id);
}
