export type Metric = 'happy' | 'totalPets' | 'pps' | 'level';

export type UpgradeType = 'click' | 'pps';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  type: UpgradeType;
  basePrice: number;
  gain: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  metric: Metric;
  threshold: number;
}

export interface FloatingText {
  id: string;
  xPercent: number;
  yPercent: number;
  value: string;
  life: number;
}

export interface Ring {
  id: string;
  xPercent: number;
  yPercent: number;
  life: number;
}

export interface ComboState {
  count: number;
  bonus: number;
}

export interface SkillState {
  active: boolean;
  timeLeft: number;
  cooldown: number;
}

export interface GameLogEntry {
  id: string;
  message: string;
  createdAt: number;
}

export interface FXState {
  texts: FloatingText[];
  rings: Ring[];
}

export interface GameState {
  happy: number;
  petPower: number;
  pps: number;
  totalPets: number;
  combo: ComboState;
  lastClickAt: number;
  skill: SkillState;
  level: number;
  exp: number;
  nextExp: number;
  achievements: string[];
  upgrades: Record<string, number>;
  log: GameLogEntry[];
  fx: FXState;
  lastSavedAt: number;
  version: string;
}

export interface GameStore extends GameState {
  tick: (dt: number) => void;
  click: (xPercent: number, yPercent: number) => void;
  buy: (id: string) => void;
  save: (manual?: boolean) => void;
  reset: () => void;
  activateSkill: () => void;
  recalcPPS: () => void;
  checkAchievements: () => void;
}
