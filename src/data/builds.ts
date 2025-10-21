export type BuildArchetype = 'burst' | 'engine' | 'luck' | 'tempo' | 'utility';

// Temporary run bonuses gained from reward cards.
export type BuildBonus = {
  id: string;
  nameKey: string;
  descKey: string;
  archetype: BuildArchetype;
  tier: 1 | 2 | 3;
  effects: Partial<{
    clickMult: number;
    ppsMult: number;
    critChancePlus: number;
    critMultPlus: number;
    comboHoldPlus: number;
    skillCdMult: number;
    skillExtendPerClick: number;
    dotMult: number;
    enemyCastSlow: number;
    instantHappyPlus: number;
  }>;
};

// Permanent upgrades unlocked with Cat Souls.
export type MetaNode = {
  id: string;
  nameKey: string;
  descKey: string;
  archetype: BuildArchetype;
  maxLevel: number;
  level: number;
  perLevel: Partial<BuildBonus['effects']>;
  costPerLevel: number;
};

export type BuildArchetypeInfo = {
  id: BuildArchetype;
  titleKey: string;
  descKey: string;
  gradientFrom: string;
  gradientTo: string;
  textClass: string;
  badgeRing: string;
  icon: string;
  signatureBonusIds: string[];
};

export const BUILD_ARCHETYPES: BuildArchetype[] = [
  'burst',
  'engine',
  'luck',
  'tempo',
  'utility',
];

export const BUILD_ARCHETYPE_INFO: Record<BuildArchetype, BuildArchetypeInfo> = {
  burst: {
    id: 'burst',
    titleKey: 'build.archetype.burst',
    descKey: 'build.archetypeDesc.burst',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-orange-500',
    textClass: 'text-rose-600',
    badgeRing: 'ring-rose-400/60',
    icon: 'MousePointer2',
    signatureBonusIds: ['burst.doubleTap', 'burst.comboDrive', 'burst.impactPalm'],
  },
  engine: {
    id: 'engine',
    titleKey: 'build.archetype.engine',
    descKey: 'build.archetypeDesc.engine',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-lime-500',
    textClass: 'text-amber-600',
    badgeRing: 'ring-amber-400/60',
    icon: 'Gauge',
    signatureBonusIds: ['engine.dispenser', 'engine.nightWatch', 'engine.resonanceTower'],
  },
  luck: {
    id: 'luck',
    titleKey: 'build.archetype.luck',
    descKey: 'build.archetypeDesc.luck',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
    textClass: 'text-emerald-600',
    badgeRing: 'ring-emerald-400/60',
    icon: 'Sparkles',
    signatureBonusIds: ['luck.luckyWhisker', 'luck.critBattery', 'luck.jackpot'],
  },
  tempo: {
    id: 'tempo',
    titleKey: 'build.archetype.tempo',
    descKey: 'build.archetypeDesc.tempo',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-indigo-500',
    textClass: 'text-sky-600',
    badgeRing: 'ring-sky-400/60',
    icon: 'Repeat',
    signatureBonusIds: ['tempo.resonancePalm', 'tempo.cdTuner', 'tempo.cycleRush'],
  },
  utility: {
    id: 'utility',
    titleKey: 'build.archetype.utility',
    descKey: 'build.archetypeDesc.utility',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-slate-600',
    textClass: 'text-violet-600',
    badgeRing: 'ring-violet-400/60',
    icon: 'Wand2',
    signatureBonusIds: ['utility.emberFur', 'utility.frostPaw', 'utility.hexShadow'],
  },
};

const bonuses: BuildBonus[] = [
  {
    id: 'burst.doubleTap',
    nameKey: 'build.burst.doubleTap.name',
    descKey: 'build.burst.doubleTap.desc',
    archetype: 'burst',
    tier: 1,
    effects: {
      clickMult: 1.35,
    },
  },
  {
    id: 'burst.comboDrive',
    nameKey: 'build.burst.comboDrive.name',
    descKey: 'build.burst.comboDrive.desc',
    archetype: 'burst',
    tier: 2,
    effects: {
      comboHoldPlus: 0.5,
      instantHappyPlus: 0.05,
    },
  },
  {
    id: 'burst.impactPalm',
    nameKey: 'build.burst.impactPalm.name',
    descKey: 'build.burst.impactPalm.desc',
    archetype: 'burst',
    tier: 3,
    effects: {
      clickMult: 1.5,
      critMultPlus: 0.25,
    },
  },
  {
    id: 'engine.dispenser',
    nameKey: 'build.engine.dispenser.name',
    descKey: 'build.engine.dispenser.desc',
    archetype: 'engine',
    tier: 1,
    effects: {
      ppsMult: 1.15,
    },
  },
  {
    id: 'engine.nightWatch',
    nameKey: 'build.engine.nightWatch.name',
    descKey: 'build.engine.nightWatch.desc',
    archetype: 'engine',
    tier: 2,
    effects: {
      ppsMult: 1.2,
      instantHappyPlus: 0.04,
    },
  },
  {
    id: 'engine.resonanceTower',
    nameKey: 'build.engine.resonanceTower.name',
    descKey: 'build.engine.resonanceTower.desc',
    archetype: 'engine',
    tier: 3,
    effects: {
      ppsMult: 1.25,
      skillExtendPerClick: 0.02,
    },
  },
  {
    id: 'luck.luckyWhisker',
    nameKey: 'build.luck.luckyWhisker.name',
    descKey: 'build.luck.luckyWhisker.desc',
    archetype: 'luck',
    tier: 1,
    effects: {
      critChancePlus: 0.1,
      critMultPlus: 0.2,
    },
  },
  {
    id: 'luck.critBattery',
    nameKey: 'build.luck.critBattery.name',
    descKey: 'build.luck.critBattery.desc',
    archetype: 'luck',
    tier: 2,
    effects: {
      critChancePlus: 0.05,
      critMultPlus: 0.3,
    },
  },
  {
    id: 'luck.jackpot',
    nameKey: 'build.luck.jackpot.name',
    descKey: 'build.luck.jackpot.desc',
    archetype: 'luck',
    tier: 3,
    effects: {
      instantHappyPlus: 0.12,
    },
  },
  {
    id: 'tempo.resonancePalm',
    nameKey: 'build.tempo.resonancePalm.name',
    descKey: 'build.tempo.resonancePalm.desc',
    archetype: 'tempo',
    tier: 1,
    effects: {
      skillExtendPerClick: 0.05,
    },
  },
  {
    id: 'tempo.cdTuner',
    nameKey: 'build.tempo.cdTuner.name',
    descKey: 'build.tempo.cdTuner.desc',
    archetype: 'tempo',
    tier: 2,
    effects: {
      skillCdMult: 0.9,
    },
  },
  {
    id: 'tempo.cycleRush',
    nameKey: 'build.tempo.cycleRush.name',
    descKey: 'build.tempo.cycleRush.desc',
    archetype: 'tempo',
    tier: 3,
    effects: {
      skillCdMult: 0.92,
      clickMult: 1.2,
    },
  },
  {
    id: 'utility.emberFur',
    nameKey: 'build.utility.emberFur.name',
    descKey: 'build.utility.emberFur.desc',
    archetype: 'utility',
    tier: 1,
    effects: {
      dotMult: 1.25,
    },
  },
  {
    id: 'utility.frostPaw',
    nameKey: 'build.utility.frostPaw.name',
    descKey: 'build.utility.frostPaw.desc',
    archetype: 'utility',
    tier: 2,
    effects: {
      enemyCastSlow: 0.12,
    },
  },
  {
    id: 'utility.hexShadow',
    nameKey: 'build.utility.hexShadow.name',
    descKey: 'build.utility.hexShadow.desc',
    archetype: 'utility',
    tier: 3,
    effects: {
      dotMult: 1.35,
      enemyCastSlow: 0.08,
    },
  },
];

const metaNodeDefs: Record<
  string,
  Omit<MetaNode, 'level'>
> = {
  'meta.burst.clickBase': {
    id: 'meta.burst.clickBase',
    nameKey: 'meta.burst.clickBase.name',
    descKey: 'meta.burst.clickBase.desc',
    archetype: 'burst',
    maxLevel: 10,
    perLevel: {
      clickMult: 1.05,
    },
    costPerLevel: 12,
  },
  'meta.burst.critDrive': {
    id: 'meta.burst.critDrive',
    nameKey: 'meta.burst.critDrive.name',
    descKey: 'meta.burst.critDrive.desc',
    archetype: 'burst',
    maxLevel: 5,
    perLevel: {
      critMultPlus: 0.1,
    },
    costPerLevel: 18,
  },
  'meta.engine.hub': {
    id: 'meta.engine.hub',
    nameKey: 'meta.engine.hub.name',
    descKey: 'meta.engine.hub.desc',
    archetype: 'engine',
    maxLevel: 12,
    perLevel: {
      ppsMult: 1.04,
    },
    costPerLevel: 10,
  },
  'meta.engine.warmup': {
    id: 'meta.engine.warmup',
    nameKey: 'meta.engine.warmup.name',
    descKey: 'meta.engine.warmup.desc',
    archetype: 'engine',
    maxLevel: 6,
    perLevel: {
      instantHappyPlus: 0.03,
    },
    costPerLevel: 16,
  },
  'meta.luck.focus': {
    id: 'meta.luck.focus',
    nameKey: 'meta.luck.focus.name',
    descKey: 'meta.luck.focus.desc',
    archetype: 'luck',
    maxLevel: 10,
    perLevel: {
      critChancePlus: 0.02,
    },
    costPerLevel: 14,
  },
  'meta.luck.overflow': {
    id: 'meta.luck.overflow',
    nameKey: 'meta.luck.overflow.name',
    descKey: 'meta.luck.overflow.desc',
    archetype: 'luck',
    maxLevel: 5,
    perLevel: {
      critMultPlus: 0.15,
    },
    costPerLevel: 22,
  },
  'meta.tempo.stability': {
    id: 'meta.tempo.stability',
    nameKey: 'meta.tempo.stability.name',
    descKey: 'meta.tempo.stability.desc',
    archetype: 'tempo',
    maxLevel: 8,
    perLevel: {
      skillCdMult: 0.96,
    },
    costPerLevel: 15,
  },
  'meta.tempo.reservoir': {
    id: 'meta.tempo.reservoir',
    nameKey: 'meta.tempo.reservoir.name',
    descKey: 'meta.tempo.reservoir.desc',
    archetype: 'tempo',
    maxLevel: 6,
    perLevel: {
      skillExtendPerClick: 0.01,
    },
    costPerLevel: 20,
  },
  'meta.utility.hexWeave': {
    id: 'meta.utility.hexWeave',
    nameKey: 'meta.utility.hexWeave.name',
    descKey: 'meta.utility.hexWeave.desc',
    archetype: 'utility',
    maxLevel: 9,
    perLevel: {
      dotMult: 1.06,
    },
    costPerLevel: 13,
  },
  'meta.utility.stasis': {
    id: 'meta.utility.stasis',
    nameKey: 'meta.utility.stasis.name',
    descKey: 'meta.utility.stasis.desc',
    archetype: 'utility',
    maxLevel: 5,
    perLevel: {
      enemyCastSlow: 0.04,
    },
    costPerLevel: 19,
  },
};

const BONUS_MAP = new Map<string, BuildBonus>(bonuses.map((bonus) => [bonus.id, bonus]));

export function listBuildBonuses(): BuildBonus[] {
  return bonuses;
}

export function getBuildBonus(id: string): BuildBonus {
  const bonus = BONUS_MAP.get(id);
  if (!bonus) {
    throw new Error(`Unknown build bonus: ${id}`);
  }
  return bonus;
}

export function listBonusesByArchetype(archetype: BuildArchetype): BuildBonus[] {
  return bonuses.filter((bonus) => bonus.archetype === archetype);
}

export function listMetaNodes(): MetaNode[] {
  return Object.values(metaNodeDefs).map((def) => ({
    ...def,
    level: 0,
  }));
}

export function createInitialMetaNodes(): Record<string, MetaNode> {
  return Object.fromEntries(
    Object.values(metaNodeDefs).map((def) => [
      def.id,
      {
        ...def,
        level: 0,
      },
    ]),
  );
}
