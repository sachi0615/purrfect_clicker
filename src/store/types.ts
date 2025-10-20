export type TempMods = {
  critChance?: number;
  critMult?: number;
  clickMult?: number;
  ppsMult?: number;
  skillDurationPlus?: number;
  skillCdMult?: number;
  bossClickMult?: number;
  shopDiscount?: number;
};

export type RewardCardId = string;

export type RewardCard = {
  id: RewardCardId;
  name: string;
  desc: string;
  apply: (mods: TempMods) => TempMods;
};

export type Enemy = {
  id: string;
  name: string;
  maxHp: number;
  hp: number;
  rewardHappy: number;
};

export type Stage = {
  id: string;
  name: string;
  kind: 'goal' | 'boss';
  goalHappy?: number;
  boss?: Enemy;
  rewardPool: RewardCardId[];
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
