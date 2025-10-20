export type MetaUpgradeId =
  | 'skill.durationPlus'
  | 'skill.cdReduce'
  | 'skill.cheerful.ppsBonus';

export type MetaUpgradeSpec = {
  id: MetaUpgradeId;
  nameKey: string;
  descKey: string;
  baseCost: number;
  costGrowth: number;
  maxLevel?: number;
  describe: (level: number) => Record<string, number>;
};

export type MetaUpgradeView = MetaUpgradeSpec & {
  maxLevel?: number;
};

export function listMetaUpgrades(): MetaUpgradeSpec[] {
  return META_UPGRADES;
}

export function getMetaUpgradeSpec(id: MetaUpgradeId): MetaUpgradeSpec {
  const spec = META_UPGRADE_MAP.get(id);
  if (!spec) {
    throw new Error(`Unknown meta upgrade: ${id}`);
  }
  return spec;
}

export function computeMetaUpgradeCost(
  spec: MetaUpgradeSpec,
  currentLevel: number,
): number {
  return Math.ceil(spec.baseCost * Math.pow(spec.costGrowth, currentLevel));
}

export const META_DURATION_PER_LEVEL = 1;
export const META_COOLDOWN_REDUCTION_PER_LEVEL = 0.05;
export const META_CD_FLOOR = 0.3;
export const CHEERFUL_META_PPS_PER_LEVEL = 0.05;

const META_UPGRADES: MetaUpgradeSpec[] = [
  {
    id: 'skill.durationPlus',
    nameKey: 'meta.upgrades.skillDuration.name',
    descKey: 'meta.upgrades.skillDuration.desc',
    baseCost: 40,
    costGrowth: 1.65,
    describe: (level) => {
      const current = level * META_DURATION_PER_LEVEL;
      const next = (level + 1) * META_DURATION_PER_LEVEL;
      return {
        perLevel: META_DURATION_PER_LEVEL,
        current,
        next,
      };
    },
  },
  {
    id: 'skill.cdReduce',
    nameKey: 'meta.upgrades.skillCooldown.name',
    descKey: 'meta.upgrades.skillCooldown.desc',
    baseCost: 60,
    costGrowth: 1.7,
    maxLevel: 10,
    describe: (level) => {
      const current = level * META_COOLDOWN_REDUCTION_PER_LEVEL * 100;
      const next = (level + 1) * META_COOLDOWN_REDUCTION_PER_LEVEL * 100;
      return {
        perLevel: META_COOLDOWN_REDUCTION_PER_LEVEL * 100,
        current,
        next,
      };
    },
  },
  {
    id: 'skill.cheerful.ppsBonus',
    nameKey: 'meta.upgrades.skillCheerful.name',
    descKey: 'meta.upgrades.skillCheerful.desc',
    baseCost: 55,
    costGrowth: 1.6,
    describe: (level) => {
      const current = level * CHEERFUL_META_PPS_PER_LEVEL * 100;
      const next = (level + 1) * CHEERFUL_META_PPS_PER_LEVEL * 100;
      return {
        perLevel: CHEERFUL_META_PPS_PER_LEVEL * 100,
        current,
        next,
      };
    },
  },
];

const META_UPGRADE_MAP = new Map<MetaUpgradeId, MetaUpgradeSpec>(
  META_UPGRADES.map((spec) => [spec.id, spec]),
);
