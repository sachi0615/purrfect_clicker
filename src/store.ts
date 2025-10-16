import { nanoid } from 'nanoid';
import { create } from 'zustand';

import { ACHIEVEMENTS } from './data/achievements';
import { SHOP, priceOf } from './data/shop';
import type { GameLogEntry, GameState, GameStore, Metric } from './types';
import { clamp, fmt, now } from './util';

const STORAGE_KEY = 'purrfect_clicker_v1';
const VERSION = '1.0.0';

const COMBO_WINDOW_MS = 1_200;
const COMBO_STEP = 0.05;
const MAX_COMBO_BONUS = 1.0;

const CRIT_CHANCE = 0.1;
const CRIT_MULTIPLIER = 2.0;

const SKILL_DURATION = 10;
const SKILL_COOLDOWN = 35;
const SKILL_BONUS = 0.75;

const LEVEL_EXP_BASE = 10;
const LEVEL_EXP_GROWTH = 1.35;
const LEVEL_PET_POWER_MULT = 1.08;

const MAX_OFFLINE_SECONDS = 60 * 60 * 8; // 8 hours
const TEXT_LIFETIME = 1.2;
const RING_LIFETIME = 1.5;

const LOG_LIMIT = 100;
const FX_LIMIT = 24;

function createLog(message: string): GameLogEntry {
  return { id: nanoid(), message, createdAt: now() };
}

function trimLogs(logs: GameLogEntry[]): GameLogEntry[] {
  if (logs.length <= LOG_LIMIT) {
    return logs;
  }
  return logs.slice(logs.length - LOG_LIMIT);
}

function pushLog(logs: GameLogEntry[], message: string): GameLogEntry[] {
  return trimLogs([...logs, createLog(message)]);
}

function sanitiseLogs(raw: unknown): GameLogEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => {
      if (!entry) {
        return null;
      }
      if (typeof entry === 'string') {
        return createLog(entry);
      }
      if (typeof entry === 'object') {
        const obj = entry as Partial<GameLogEntry> & { message?: string };
        if (!obj.message) {
          return null;
        }
        return {
          id: obj.id ?? nanoid(),
          message: obj.message,
          createdAt: obj.createdAt ?? now(),
        };
      }
      return null;
    })
    .filter((entry): entry is GameLogEntry => Boolean(entry))
    .slice(-LOG_LIMIT);
}

function baseState(): GameState {
  const upgrades: Record<string, number> = {};
  SHOP.forEach((item) => {
    upgrades[item.id] = 0;
  });

  return {
    happy: 0,
    petPower: 1,
    pps: 0,
    totalPets: 0,
    combo: { count: 0, bonus: 0 },
    lastClickAt: 0,
    skill: { active: false, timeLeft: 0, cooldown: 0 },
    level: 1,
    exp: 0,
    nextExp: LEVEL_EXP_BASE,
    achievements: [],
    upgrades,
    log: [],
    fx: { texts: [], rings: [] },
    lastSavedAt: now(),
    version: VERSION,
  };
}

function metricValue(state: GameState, metric: Metric): number {
  switch (metric) {
    case 'happy':
      return state.happy;
    case 'totalPets':
      return state.totalPets;
    case 'pps':
      return state.pps;
    case 'level':
      return state.level;
    default:
      return 0;
  }
}

function levelCheck(
  level: number,
  exp: number,
  nextExp: number,
  petPower: number,
  logs: GameLogEntry[],
) {
  let currentLevel = level;
  let currentExp = exp;
  let currentNextExp = nextExp;
  let currentPetPower = petPower;
  let currentLogs = logs;

  while (currentExp >= currentNextExp) {
    currentExp -= currentNextExp;
    currentLevel += 1;
    currentNextExp = Math.ceil(currentNextExp * LEVEL_EXP_GROWTH);
    currentPetPower *= LEVEL_PET_POWER_MULT;
    currentLogs = pushLog(currentLogs, `レベル ${currentLevel} に到達！ なで力が成長しました。`);
  }

  return {
    level: currentLevel,
    exp: currentExp,
    nextExp: currentNextExp,
    petPower: currentPetPower,
    log: currentLogs,
  };
}

function loadState(): GameState {
  const fresh = baseState();

  if (typeof window === 'undefined') {
    return {
      ...fresh,
      log: pushLog(fresh.log, 'ゲームを開始しました。'),
    };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      ...fresh,
      log: pushLog(fresh.log, 'ゲームを開始しました。'),
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const current = now();

    const merged: GameState = {
      ...fresh,
      ...parsed,
      combo: { count: 0, bonus: 0 },
      skill: parsed?.skill
        ? {
            active: Boolean(parsed.skill.active),
            timeLeft: Math.max(0, parsed.skill.timeLeft ?? 0),
            cooldown: Math.max(0, parsed.skill.cooldown ?? 0),
          }
        : fresh.skill,
      achievements: Array.isArray(parsed?.achievements) ? [...parsed!.achievements] : [],
      upgrades: { ...fresh.upgrades, ...(parsed?.upgrades ?? {}) },
      log: sanitiseLogs(parsed?.log),
      fx: { texts: [], rings: [] },
      version: VERSION,
      lastSavedAt: current,
    };

    const elapsedSeconds = clamp(
      (current - (parsed?.lastSavedAt ?? current)) / 1000,
      0,
      MAX_OFFLINE_SECONDS,
    );

    if (elapsedSeconds > 0 && merged.pps > 0) {
      const offlineGain = merged.pps * elapsedSeconds;
      merged.happy += offlineGain;
      merged.log = pushLog(
        merged.log,
        `おかえりなさい！ 離れている間にハッピーを ${fmt(offlineGain)} 獲得しました。`,
      );
    } else {
      merged.log = pushLog(merged.log, 'おかえりなさい！');
    }

    return merged;
  } catch (error) {
    console.error('Failed to load save data', error);
    return {
      ...fresh,
      log: pushLog(fresh.log, 'セーブデータの読み込みに失敗したため新しく開始します。'),
    };
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...loadState(),

  tick: (dt: number) => {
    const current = now();

    set((state) => {
      let combo = state.combo;
      if (combo.count > 0 && current - state.lastClickAt > COMBO_WINDOW_MS) {
        combo = { count: 0, bonus: 0 };
      }

      let { active, timeLeft, cooldown } = state.skill;
      if (active) {
        timeLeft -= dt;
        if (timeLeft <= 0) {
          active = false;
          timeLeft = 0;
          cooldown = SKILL_COOLDOWN;
        }
      }
      if (!active && cooldown > 0) {
        cooldown = Math.max(0, cooldown - dt);
      }

      const textDecay = dt / TEXT_LIFETIME;
      const ringDecay = dt / RING_LIFETIME;

      const texts = state.fx.texts
        .map((text) => ({ ...text, life: text.life - textDecay }))
        .filter((text) => text.life > 0)
        .slice(-FX_LIMIT);
      const rings = state.fx.rings
        .map((ring) => ({ ...ring, life: ring.life - ringDecay }))
        .filter((ring) => ring.life > 0)
        .slice(-FX_LIMIT);

      const skillMultiplier = active ? 1 + SKILL_BONUS : 1;
      const autoGain = state.pps * skillMultiplier * dt;

      const happy = state.happy + autoGain;

      return {
        ...state,
        happy,
        combo,
        skill: { active, timeLeft: Math.max(0, timeLeft), cooldown },
        fx: { texts, rings },
      };
    });
  },

  click: (xPercent: number, yPercent: number) => {
    const current = now();
    const isCrit = Math.random() < CRIT_CHANCE;

    set((state) => {
      const withinComboWindow = current - state.lastClickAt <= COMBO_WINDOW_MS;
      const comboCount = withinComboWindow ? state.combo.count + 1 : 0;
      const comboBonus = Math.min(MAX_COMBO_BONUS, comboCount * COMBO_STEP);

      const skillMultiplier = state.skill.active ? 1 + SKILL_BONUS : 1;
      const critMultiplier = isCrit ? CRIT_MULTIPLIER : 1;
      const gain = state.petPower * (1 + comboBonus) * critMultiplier * skillMultiplier;

      const happy = state.happy + gain;
      const totalPets = state.totalPets + 1;
      const exp = state.exp + 1 + gain * 0.1;

      let logs = pushLog(
        state.log,
        `+${fmt(gain)} ハッピー ${isCrit ? '(クリティカル) ' : ''}x${(1 + comboBonus).toFixed(2)}`,
      );

      const levelled = levelCheck(state.level, exp, state.nextExp, state.petPower, logs);

      const texts = [
        ...state.fx.texts.slice(-FX_LIMIT + 1),
        {
          id: nanoid(),
          xPercent,
          yPercent,
          value: `+${fmt(gain)}${isCrit ? '!!' : ''}`,
          life: 1,
        },
      ];
      const rings = [
        ...state.fx.rings.slice(-FX_LIMIT + 1),
        {
          id: nanoid(),
          xPercent,
          yPercent,
          life: 1,
        },
      ];

      return {
        ...state,
        happy,
        totalPets,
        combo: { count: comboCount, bonus: comboBonus },
        lastClickAt: current,
        exp: levelled.exp,
        level: levelled.level,
        nextExp: levelled.nextExp,
        petPower: levelled.petPower,
        log: levelled.log,
        fx: { texts, rings },
      };
    });

    get().checkAchievements();
  },

  buy: (id: string) => {
    const upgrade = SHOP.find((item) => item.id === id);
    if (!upgrade) {
      return;
    }

    set((state) => {
      const owned = state.upgrades[id] ?? 0;
      const cost = priceOf(upgrade.basePrice, owned);
      if (state.happy < cost) {
        return state;
      }

      const happy = state.happy - cost;
      const upgrades = { ...state.upgrades, [id]: owned + 1 };

      let petPower = state.petPower;
      if (upgrade.type === 'click') {
        petPower += upgrade.gain;
      }

      const logs = pushLog(state.log, `${upgrade.name} を購入しました。`);

      return {
        ...state,
        happy,
        upgrades,
        petPower,
        log: logs,
      };
    });

    const { recalcPPS, checkAchievements } = get();
    recalcPPS();
    checkAchievements();
  },

  save: (manual = false) => {
    const state = get();

    if (typeof window === 'undefined') {
      return;
    }

    const timestamp = now();
    const snapshot: GameState = {
      ...state,
      fx: { texts: [], rings: [] },
      log: trimLogs(state.log),
      lastSavedAt: timestamp,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));

    set((prev) => ({
      ...prev,
      lastSavedAt: timestamp,
      log: manual ? pushLog(prev.log, 'セーブしました。') : prev.log,
    }));
  },

  reset: () => {
    const fresh = baseState();
    const freshLog = pushLog(fresh.log, 'ゲームを初期化しました。');

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    set({ ...fresh, log: freshLog });
  },

  activateSkill: () => {
    set((state) => {
      if (state.skill.active || state.skill.cooldown > 0) {
        return state;
      }

      const logs = pushLog(
        state.log,
        `ごきげんタイム発動！ ${SKILL_DURATION} 秒間ハッピー獲得 +${Math.round(
          SKILL_BONUS * 100,
        )}%。`,
      );

      return {
        ...state,
        skill: { active: true, timeLeft: SKILL_DURATION, cooldown: state.skill.cooldown },
        log: logs,
      };
    });
  },

  recalcPPS: () => {
    set((state) => {
      const total = SHOP.reduce((sum, item) => {
        if (item.type !== 'pps') {
          return sum;
        }
        const owned = state.upgrades[item.id] ?? 0;
        return sum + item.gain * owned;
      }, 0);

      return {
        ...state,
        pps: total,
      };
    });
  },

  checkAchievements: () => {
    set((state) => {
      const unlocked = new Set(state.achievements);
      let logs = state.log;
      let changed = false;

      for (const achievement of ACHIEVEMENTS) {
        if (unlocked.has(achievement.id)) {
          continue;
        }
        const value = metricValue(state, achievement.metric);
        if (value >= achievement.threshold) {
          unlocked.add(achievement.id);
          logs = pushLog(
            logs,
            `実績解除！ ${achievement.name} - ${achievement.description}`,
          );
          changed = true;
        }
      }

      if (!changed) {
        return state;
      }

      return {
        ...state,
        achievements: Array.from(unlocked),
        log: logs,
      };
    });
  },
}));

useGameStore.getState().recalcPPS();
useGameStore.getState().checkAchievements();
