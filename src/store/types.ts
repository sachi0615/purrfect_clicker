export type TempMods = {
  critChance?: number;
  critMult?: number;
  clickMult?: number;
  ppsMult?: number;
  skillDurationPlus?: number;
  skillCdMult?: number;
  bossClickMult?: number;
  shopDiscount?: number;
  bossDamageMult?: number;
  drainResist?: number;
};

export type RewardCardId = string;

type BuildArchetype = import('../store/build').BuildArchetype;

export type RewardCard = {
  id: RewardCardId;
  bonusId: string;
  archetype: BuildArchetype;
  tier: 1 | 2 | 3;
  apply?: (mods: TempMods) => TempMods;
};

export type Enemy = {
  id: string;
  name: string;
  maxHp: number;
  hp: number;
  rewardHappy: number;
  damageTakenMult?: number;
  specials?: EnemySpecial[];
};

export type Stage = {
  id: string;
  name: string;
  kind: 'goal' | 'boss';
  goalHappy?: number;
  boss?: Enemy;
  rewardPool: RewardCardId[];
  loop: number;
  order: number;
};

export type EnemySpecial = {
  id: string;
  type: 'barrier' | 'drain';
  cooldown: number;
  duration: number;
  magnitude: number;
  lastTriggeredAt?: number;
  activeUntil?: number;
};

type CharacterId = import('./chars').CharacterId;

export type RunState = {
  runId: string;
  seed: number;
  startedAt: number;
  stageIndex: number;
  stages: Stage[];
  happy: number;
  totalPets: number;
  clickPower: number;
  pps: number;
  tempMods: TempMods;
  alive: boolean;
  cleared: boolean;
  characterId: CharacterId;
};

export type MetaProgress = {
  catSouls: number;
  permanentUpgrades: Record<string, number>;
};

export type RewardSummary = {
  cards: RewardCardId[];
};

export type RunSummary = {
  runId: string;
  seed: number;
  cleared: boolean;
  stagesCleared: number;
  totalStages: number;
  totalHappy: number;
  startedAt: number;
  cards: RewardCardId[];
};

export type FloatingText = {
  id: string;
  value: string;
  life: number;
  offsetX: number;
  offsetY: number;
};
