import { SaveData, SAVE_KEY, DEFAULT_PLAYER_STATS } from '../types/GameTypes';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const TOTAL_LEVELS = 21;

export function defaultSave(): SaveData {
  return {
    currentLevel: 1,
    lives: DEFAULT_PLAYER_STATS.startingLives,
    coins: 0,
    levelsCompleted: new Array(TOTAL_LEVELS).fill(false),
    highScore: 0,
  };
}

function isValidSave(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Partial<SaveData>;
  return (
    typeof s.currentLevel === 'number' &&
    typeof s.lives === 'number' &&
    typeof s.coins === 'number' &&
    Array.isArray(s.levelsCompleted) &&
    s.levelsCompleted.length === TOTAL_LEVELS &&
    s.levelsCompleted.every((b) => typeof b === 'boolean') &&
    typeof s.highScore === 'number'
  );
}

export class SaveSystem {
  private storage: StorageLike;

  constructor(storage?: StorageLike) {
    this.storage = storage ?? this.getDefaultStorage();
  }

  private getDefaultStorage(): StorageLike {
    if (typeof globalThis !== 'undefined' && (globalThis as { localStorage?: StorageLike }).localStorage) {
      return (globalThis as { localStorage: StorageLike }).localStorage;
    }
    const memory = new Map<string, string>();
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    };
  }

  load(): SaveData {
    try {
      const raw = this.storage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      if (!isValidSave(parsed)) return defaultSave();
      return parsed;
    } catch {
      return defaultSave();
    }
  }

  save(data: SaveData): void {
    this.storage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  clear(): void {
    this.storage.removeItem(SAVE_KEY);
  }

  markLevelComplete(levelIndex: number): SaveData {
    const data = this.load();
    if (levelIndex >= 0 && levelIndex < data.levelsCompleted.length) {
      data.levelsCompleted[levelIndex] = true;
      if (levelIndex + 1 < data.levelsCompleted.length) {
        data.currentLevel = Math.max(data.currentLevel, levelIndex + 2);
      }
    }
    this.save(data);
    return data;
  }

  updateLivesAndCoins(lives: number, coins: number): SaveData {
    const data = this.load();
    data.lives = lives;
    data.coins = coins;
    this.save(data);
    return data;
  }
}
