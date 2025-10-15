import { nanoid } from 'nanoid';
import { create } from 'zustand';

import { ACHIEVEMENTS } from './data/achievements';
import { SHOP, priceOf } from './data/shop';
import type { GameLogEntry, GameState, GameStore } from './types';
import { clamp, now } from './util';

const STORAGE_KEY = 'purrfect_clicker_v1';
const VERSION = '1.0.0';

const COMBO_WINDOW_MS = 1200;
const MAX_OFFLINE_SECONDS = 60 * 60 * 8;
const TEXT_LIFETIME = 1.2;
const RING_LIFETIME = 1.5;
const LOG_LIMIT = 100;

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
    nextExp: 20,
    achievements: [],
    upgrades,
    log: [],
    fx: { texts: [], rings: [] },
    lastSavedAt: now(),
    version: VERSION,
  };
}

function loadState(): GameState {
  if (typeof window === 'undefined') {
    const fresh = baseState();
    return { ...fresh, log: pushLog(fresh.log, 'ゲームを開始しました。') };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = baseState();
    return { ...fresh, log: pushLog(fresh.log, 'ゲームを開始しました。') };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const base = baseState();
    const current = now();
    const merged: GameState = {
      ...base,
      ...parsed,
      combo: parsed?.combo
        ? { count: parsed.combo.count ?? 0, bonus: parsed.combo.bonus ?? 0 }
        : base.combo,
      skill: parsed?.skill
        ? {
            active: Boolean(parsed.skill.active),
            timeLeft: parsed.skill.timeLeft ?? 0,
            cooldown: parsed.skill.cooldown ?? 0,
          }
        : base.skill,
      achievements: Array.isArray(parsed?.achievements) ? [...parsed!.achievements] : [],
      upgrades: { ...base.upgrades, ...(parsed?.upgrades ?? {}) },
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
      const gain = merged.pps * elapsedSeconds;
      merged.happy += gain;
      merged.exp += gain;
      merged.log = pushLog(
        merged.log,
        `オフラインで ${gain.toFixed(2)} ハッピー獲得！（${Math.floor(elapsedSeconds)} 秒）`,
      );
    } else {
      merged.log = pushLog(merged.log, '保存データから復帰しました。');
    }

    return merged;
  } catch (error) {
    console.warn('Failed to load save data', error);
    const fresh = baseState();
    return {
      ...fresh,
      log: pushLog(fresh.log, 'セーブデータの読み込みに失敗したため新しく開始します。'),
    };
  }
}

function metricValue(state: GameState, metric: string): number {
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

export const useGameStore = create<GameStore>((set, get) => ({
  ...loadState(),

  tick: (dt: number) => {
    if (!Number.isFinite(dt) || dt <= 0) {
      return;
    }

    set((state) => {
      const current = now();
      const texts = state.fx.texts
        .map((text) => ({
          ...text,
          life: text.life - dt / TEXT_LIFETIME,
        }))
        .filter((text) => text.life > 0);

      const ringsExisting = state.fx.rings
        .map((ring) => ({
          ...ring,
          life: ring.life - dt / RING_LIFETIME,
        }))
        .filter((ring) => ring.life > 0);

      const skill = { ...state.skill };
      let logs = state.log;

      if (skill.active) {
        skill.timeLeft = Math.max(0, skill.timeLeft - dt);
        if (skill.timeLeft <= 0) {
          skill.active = false;
          skill.timeLeft = 0;
          skill.cooldown = 35;
          logs = pushLog(logs, 'ごきげんタイムが終了しました。');
        }
      } else if (skill.cooldown > 0) {
        skill.cooldown = Math.max(0, skill.cooldown - dt);
      }

      let combo = state.combo;
      if (combo.count > 0 && current - state.lastClickAt > COMBO_WINDOW_MS) {
        combo = { count: 0, bonus: 0 };
      }

      const passiveMultiplier = skill.active ? 1.75 : 1;
      const gain = state.pps * passiveMultiplier * dt;
      let happy = state.happy + gain;
      let exp = state.exp + gain;
      let level = state.level;
      let nextExp = state.nextExp;
      let petPower = state.petPower;
      const rings = [...ringsExisting];

      while (exp >= nextExp) {
        exp -= nextExp;
        level += 1;
        petPower += 0.5;
        nextExp = Math.ceil(nextExp * 1.35);
        rings.push({
          id: nanoid(),
          xPercent: 50,
          yPercent: 50,
          life: 1,
        });
        logs = pushLog(logs, `レベル ${level} にアップ！なで力 +0.5`);
      }

      return {
        ...state,
        happy,
        exp,
        level,
        nextExp,
        petPower,
        skill,
        combo,
        fx: {
          texts,
          rings,
        },
        log: logs,
      };
    });

    get().checkAchievements();
  },

  click: (xPercent: number, yPercent: number) => {
    set((state) => {
      const current = now();
      const withinCombo = current - state.lastClickAt <= COMBO_WINDOW_MS;
      const comboCount = withinCombo ? state.combo.count + 1 : 0;
      const comboBonus = clamp(comboCount * 0.05, 0, 1);
      const crit = Math.random() < 0.1;
      const multiplier = (1 + comboBonus) * (crit ? 2 : 1);
      const gain = state.petPower * multiplier;

      const happy = state.happy + gain;
      const totalPets = state.totalPets + 1;
      const exp = state.exp + gain;

      const message = crit
        ? `クリティカル！${gain.toFixed(2)} ハッピー獲得！`
        : `なでた！${gain.toFixed(2)} ハッピー獲得。`;
      const logs = pushLog(state.log, message);

      const texts = [
        ...state.fx.texts,
        {
          id: nanoid(),
          xPercent,
          yPercent,
          value: `+${gain.toFixed(1)}`,
          life: 1,
        },
      ];
      const rings = [
        ...state.fx.rings,
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
        exp,
        combo: { count: comboCount, bonus: comboBonus },
        lastClickAt: current,
        fx: {
          texts,
          rings,
        },
        log: logs,
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
      let logs = pushLog(state.log, `${upgrade.name} を購入しました！`);

      if (upgrade.type === 'click') {
        petPower += upgrade.gain;
      }

      return {
        ...state,
        happy,
        upgrades,
        petPower,
        log: logs,
      };
    });

    if (upgrade.type === 'pps') {
      get().recalcPPS();
    }

    get().checkAchievements();
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
    const log = pushLog(fresh.log, 'ゲームを初期化しました。');
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    set({ ...fresh, log });
  },

  activateSkill: () => {
    set((state) => {
      if (state.skill.active || state.skill.cooldown > 0) {
        return state;
      }
      return {
        ...state,
        skill: { active: true, timeLeft: 10, cooldown: 0 },
        log: pushLog(state.log, 'ごきげんタイムを発動！'),
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
          logs = pushLog(logs, `実績解除：${achievement.name}`);
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

// Ensure PPS reflects any loaded upgrades.
useGameStore.getState().recalcPPS();
useGameStore.getState().checkAchievements();
