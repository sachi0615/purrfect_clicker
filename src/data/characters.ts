import type { CharacterSpec, PassiveSpec } from '../store/chars';
import type { SkillSpec } from '../store/skills';

const makePassive = (spec: PassiveSpec): PassiveSpec => spec;

const makeSkill = (spec: SkillSpec): SkillSpec => spec;

export const CHARACTERS: CharacterSpec[] = [
  {
    id: 'critCat',
    nameKey: 'char.critCat.name',
    descKey: 'char.critCat.desc',
    difficulty: 'normal',
    icon: 'Target',
    color: 'from-rose-500 to-pink-500',
    passives: [
      makePassive({
        id: 'critEngine',
        nameKey: 'char.passive.critEngine.name',
        descKey: 'char.passive.critEngine.desc',
        mods: {
          critChancePlus: 0.1,
          critMultPlus: 0.3,
        },
      }),
      makePassive({
        id: 'precisionPaws',
        nameKey: 'char.passive.precisionPaws.name',
        descKey: 'char.passive.precisionPaws.desc',
        mods: {
          clickMult: 1.1,
        },
      }),
    ],
    activeOverrides: {
      critBoost: {
        baseCd: 32,
        baseDuration: 14,
        effect: {
          critChancePlus: 0.3,
          critMultPlus: 0.6,
        },
      },
    },
  },
  {
    id: 'tempoCat',
    nameKey: 'char.tempoCat.name',
    descKey: 'char.tempoCat.desc',
    difficulty: 'easy',
    icon: 'Zap',
    color: 'from-blue-500 to-sky-500',
    passives: [
      makePassive({
        id: 'quickReflex',
        nameKey: 'char.passive.quickReflex.name',
        descKey: 'char.passive.quickReflex.desc',
        mods: {
          skillCdMult: 0.85,
        },
      }),
      makePassive({
        id: 'extendedPlay',
        nameKey: 'char.passive.extendedPlay.name',
        descKey: 'char.passive.extendedPlay.desc',
        mods: {
          skillDurationPlus: 2,
        },
      }),
    ],
    activeOverrides: {
      overdrive: {
        baseCd: 45 * 0.9,
        baseDuration: 12,
      },
    },
  },
  {
    id: 'summonerCat',
    nameKey: 'char.summonerCat.name',
    descKey: 'char.summonerCat.desc',
    difficulty: 'normal',
    icon: 'Sparkles',
    color: 'from-emerald-500 to-teal-500',
    passives: [
      makePassive({
        id: 'tinyHelpers',
        nameKey: 'char.passive.tinyHelpers.name',
        descKey: 'char.passive.tinyHelpers.desc',
        mods: {
          ppsMult: 1.2,
        },
      }),
      makePassive({
        id: 'emberClaws',
        nameKey: 'char.passive.emberClaws.name',
        descKey: 'char.passive.emberClaws.desc',
        mods: {
          clickMult: 1.05,
        },
      }),
    ],
    uniqueSkills: [
      makeSkill({
        id: 'spiritSwarm',
        nameKey: 'skill.spiritSwarm.name',
        descKey: 'skill.spiritSwarm.desc',
        baseCd: 42,
        baseDuration: 10,
        icon: 'Flame',
        effect: {
          ppsMult: 1.4,
        },
      }),
    ],
  },
  {
    id: 'guardianCat',
    nameKey: 'char.guardianCat.name',
    descKey: 'char.guardianCat.desc',
    difficulty: 'hard',
    icon: 'Shield',
    color: 'from-slate-500 to-indigo-500',
    passives: [
      makePassive({
        id: 'ironWhisker',
        nameKey: 'char.passive.ironWhisker.name',
        descKey: 'char.passive.ironWhisker.desc',
        mods: {
          bossTakenMult: 1.1,
        },
      }),
      makePassive({
        id: 'steadyPurr',
        nameKey: 'char.passive.steadyPurr.name',
        descKey: 'char.passive.steadyPurr.desc',
        mods: {
          ppsMult: 1.1,
        },
      }),
    ],
    activeOverrides: {
      cheerful: {
        baseCd: 40,
        effect: {
          ppsMult: 1.9,
        },
      },
    },
  },
  {
    id: 'gamblerCat',
    nameKey: 'char.gamblerCat.name',
    descKey: 'char.gamblerCat.desc',
    difficulty: 'hard',
    icon: 'Dice6',
    color: 'from-amber-500 to-red-500',
    passives: [
      makePassive({
        id: 'luckySeven',
        nameKey: 'char.passive.luckySeven.name',
        descKey: 'char.passive.luckySeven.desc',
        mods: {
          critChancePlus: 0.05,
          nonCritMultiplier: 0.9,
        },
      }),
      makePassive({
        id: 'jackpot',
        nameKey: 'char.passive.jackpot.name',
        descKey: 'char.passive.jackpot.desc',
        mods: {
          critHappyBonus: 0.25,
        },
      }),
    ],
    uniqueSkills: [
      makeSkill({
        id: 'doubleOrNothing',
        nameKey: 'skill.doubleOrNothing.name',
        descKey: 'skill.doubleOrNothing.desc',
        baseCd: 50,
        baseDuration: 6,
        icon: 'Coins',
        effect: {
          clickMult: 2,
        },
      }),
    ],
  },
];

