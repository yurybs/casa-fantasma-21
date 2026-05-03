import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem, defaultSave, StorageLike } from '../../../src/systems/SaveSystem';
import { SAVE_KEY } from '../../../src/types/GameTypes';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string): string | null {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.data.set(k, v);
  }
  removeItem(k: string): void {
    this.data.delete(k);
  }
}

describe('SaveSystem', () => {
  let storage: MemoryStorage;
  let save: SaveSystem;

  beforeEach(() => {
    storage = new MemoryStorage();
    save = new SaveSystem(storage);
  });

  it('defaultSave retorna estrutura padrão', () => {
    const data = defaultSave();
    expect(data.currentLevel).toBe(1);
    expect(data.lives).toBe(3);
    expect(data.coins).toBe(0);
    expect(data.levelsCompleted).toHaveLength(21);
    expect(data.levelsCompleted.every((b) => b === false)).toBe(true);
  });

  it('load() retorna padrão se nada estiver salvo', () => {
    const data = save.load();
    expect(data).toEqual(defaultSave());
  });

  it('save() persiste no storage', () => {
    const data = defaultSave();
    data.coins = 42;
    save.save(data);
    expect(storage.data.has(SAVE_KEY)).toBe(true);
  });

  it('load() retorna o que foi salvo', () => {
    const data = defaultSave();
    data.coins = 42;
    save.save(data);
    expect(save.load().coins).toBe(42);
  });

  it('load() retorna padrão se save corrompido (JSON inválido)', () => {
    storage.setItem(SAVE_KEY, '{not-valid-json');
    expect(save.load()).toEqual(defaultSave());
  });

  it('load() retorna padrão se shape inválido', () => {
    storage.setItem(SAVE_KEY, JSON.stringify({ foo: 'bar' }));
    expect(save.load()).toEqual(defaultSave());
  });

  it('markLevelComplete marca o nível e atualiza currentLevel', () => {
    const data = save.markLevelComplete(0);
    expect(data.levelsCompleted[0]).toBe(true);
    expect(data.currentLevel).toBeGreaterThanOrEqual(2);
  });

  it('markLevelComplete persiste entre loads', () => {
    save.markLevelComplete(0);
    expect(save.load().levelsCompleted[0]).toBe(true);
  });

  it('markLevelComplete ignora índices fora do range', () => {
    const data = save.markLevelComplete(99);
    expect(data.levelsCompleted.every((b) => b === false)).toBe(true);
  });

  it('updateLivesAndCoins persiste dados atualizados', () => {
    save.updateLivesAndCoins(2, 50);
    const loaded = save.load();
    expect(loaded.lives).toBe(2);
    expect(loaded.coins).toBe(50);
  });

  it('clear() remove o save', () => {
    save.save(defaultSave());
    save.clear();
    expect(storage.data.has(SAVE_KEY)).toBe(false);
  });

  describe('Sprint 3 — checkpoints', () => {
    it('defaultSave inicia com checkpoint nulo', () => {
      expect(defaultSave().checkpoint).toBeNull();
    });

    it('setCheckpoint salva e getCheckpoint recupera', () => {
      save.setCheckpoint(3, 560, 320);
      expect(save.getCheckpoint()).toEqual({ levelIndex: 3, x: 560, y: 320 });
    });

    it('checkpoint persiste entre instâncias (mesmo storage)', () => {
      save.setCheckpoint(2, 200, 100);
      const fresh = new SaveSystem(storage);
      expect(fresh.getCheckpoint()).toEqual({ levelIndex: 2, x: 200, y: 100 });
    });

    it('clearCheckpoint zera o checkpoint', () => {
      save.setCheckpoint(2, 200, 100);
      save.clearCheckpoint();
      expect(save.getCheckpoint()).toBeNull();
    });

    it('markLevelComplete limpa o checkpoint', () => {
      save.setCheckpoint(2, 200, 100);
      save.markLevelComplete(1);
      expect(save.getCheckpoint()).toBeNull();
    });
  });

  describe('Sprint 3 — power-ups', () => {
    it('defaultSave inicia com powerUps zerados', () => {
      expect(defaultSave().powerUps).toEqual({ waterGun: false });
    });

    it('setPowerUp persiste flag', () => {
      save.setPowerUp('waterGun', true);
      expect(save.load().powerUps.waterGun).toBe(true);
    });

    it('save antigo (sem powerUps) carrega com defaults', () => {
      const legacy = {
        currentLevel: 2,
        lives: 3,
        coins: 50,
        levelsCompleted: new Array(21).fill(false),
        highScore: 100,
      };
      legacy.levelsCompleted[0] = true;
      storage.setItem(SAVE_KEY, JSON.stringify(legacy));
      const data = save.load();
      expect(data.powerUps).toEqual({ waterGun: false });
      expect(data.checkpoint).toBeNull();
      expect(data.coins).toBe(50);
    });
  });

  describe('Sprint 3 — isLevelUnlocked', () => {
    it('Level 1 sempre desbloqueado', () => {
      expect(save.isLevelUnlocked(0)).toBe(true);
    });

    it('Level 2 bloqueado por padrão', () => {
      expect(save.isLevelUnlocked(1)).toBe(false);
    });

    it('Level 2 desbloqueado após completar Level 1', () => {
      save.markLevelComplete(0);
      expect(save.isLevelUnlocked(1)).toBe(true);
    });

    it('Level 3 desbloqueado após completar Level 2', () => {
      save.markLevelComplete(0);
      save.markLevelComplete(1);
      expect(save.isLevelUnlocked(2)).toBe(true);
    });
  });
});
