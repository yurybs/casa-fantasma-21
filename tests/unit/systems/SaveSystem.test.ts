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
});
