import {
  SaveData,
  SAVE_KEY,
  DEFAULT_PLAYER_STATS,
  CheckpointState,
  PowerUpsState,
  MAX_EXTRA_HEARTS,
} from '../types/GameTypes';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const TOTAL_LEVELS = 21;

export function defaultPowerUps(): PowerUpsState {
  return { waterGun: false, extraHearts: 0 };
}

export function defaultSave(): SaveData {
  return {
    currentLevel: 1,
    lives: DEFAULT_PLAYER_STATS.startingLives,
    coins: 0,
    levelsCompleted: new Array(TOTAL_LEVELS).fill(false),
    highScore: 0,
    checkpoint: null,
    powerUps: defaultPowerUps(),
  };
}

/**
 * Lenient parser: accepts any JSON object with the legacy required fields and
 * fills missing Sprint 3+ fields with defaults. Older saves remain readable.
 */
function parseSave(value: unknown): SaveData | null {
  if (typeof value !== 'object' || value === null) return null;
  const s = value as Partial<SaveData> & Record<string, unknown>;
  if (
    typeof s.currentLevel !== 'number' ||
    typeof s.lives !== 'number' ||
    typeof s.coins !== 'number' ||
    !Array.isArray(s.levelsCompleted) ||
    s.levelsCompleted.length !== TOTAL_LEVELS ||
    !s.levelsCompleted.every((b) => typeof b === 'boolean') ||
    typeof s.highScore !== 'number'
  ) {
    return null;
  }
  const checkpoint = parseCheckpoint(s.checkpoint);
  const powerUps = parsePowerUps(s.powerUps);
  return {
    currentLevel: s.currentLevel,
    lives: s.lives,
    coins: s.coins,
    levelsCompleted: s.levelsCompleted as boolean[],
    highScore: s.highScore,
    checkpoint,
    powerUps,
  };
}

function parseCheckpoint(value: unknown): CheckpointState | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') return null;
  const c = value as Partial<CheckpointState>;
  if (
    typeof c.levelIndex !== 'number' ||
    typeof c.x !== 'number' ||
    typeof c.y !== 'number'
  ) {
    return null;
  }
  return { levelIndex: c.levelIndex, x: c.x, y: c.y };
}

function parsePowerUps(value: unknown): PowerUpsState {
  if (typeof value !== 'object' || value === null) return defaultPowerUps();
  const p = value as Partial<PowerUpsState>;
  const extraHearts =
    typeof p.extraHearts === 'number'
      ? Math.max(0, Math.min(MAX_EXTRA_HEARTS, Math.floor(p.extraHearts)))
      : 0;
  return {
    waterGun: typeof p.waterGun === 'boolean' ? p.waterGun : false,
    extraHearts,
  };
}

export class SaveSystem {
  private storage: StorageLike;

  constructor(storage?: StorageLike) {
    this.storage = storage ?? this.getDefaultStorage();
  }

  private getDefaultStorage(): StorageLike {
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as { localStorage?: StorageLike }).localStorage
    ) {
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
      const parsed = parseSave(JSON.parse(raw));
      if (!parsed) return defaultSave();
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

  /**
   * Marks a level complete. Unlocks the next level via currentLevel and
   * clears any active checkpoint (player has finished the level).
   */
  markLevelComplete(levelIndex: number): SaveData {
    const data = this.load();
    if (levelIndex >= 0 && levelIndex < data.levelsCompleted.length) {
      data.levelsCompleted[levelIndex] = true;
      if (levelIndex + 1 < data.levelsCompleted.length) {
        data.currentLevel = Math.max(data.currentLevel, levelIndex + 2);
      }
      data.checkpoint = null;
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

  setCheckpoint(levelIndex: number, x: number, y: number): SaveData {
    const data = this.load();
    data.checkpoint = { levelIndex, x, y };
    this.save(data);
    return data;
  }

  clearCheckpoint(): SaveData {
    const data = this.load();
    data.checkpoint = null;
    this.save(data);
    return data;
  }

  getCheckpoint(): CheckpointState | null {
    return this.load().checkpoint;
  }

  setPowerUp<K extends keyof PowerUpsState>(key: K, value: PowerUpsState[K]): SaveData {
    const data = this.load();
    data.powerUps[key] = value;
    this.save(data);
    return data;
  }

  /** Increments extraHearts by 1 (capped at MAX_EXTRA_HEARTS); returns new total. */
  addExtraHeart(): SaveData {
    const data = this.load();
    data.powerUps.extraHearts = Math.min(MAX_EXTRA_HEARTS, data.powerUps.extraHearts + 1);
    this.save(data);
    return data;
  }

  isLevelUnlocked(levelIndex: number): boolean {
    const data = this.load();
    if (levelIndex <= 0) return true;
    if (levelIndex >= data.levelsCompleted.length) return false;
    return data.currentLevel - 1 >= levelIndex || data.levelsCompleted[levelIndex];
  }
}
