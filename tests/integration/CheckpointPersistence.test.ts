import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem, StorageLike } from '../../src/systems/SaveSystem';

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

describe('Checkpoint persistence flow', () => {
  let storage: MemoryStorage;
  let save: SaveSystem;

  beforeEach(() => {
    storage = new MemoryStorage();
    save = new SaveSystem(storage);
  });

  it('checkpoint sobrevive a uma "morte" (nova SaveSystem com mesmo storage)', () => {
    save.setCheckpoint(3, 560, 320);
    const next = new SaveSystem(storage);
    expect(next.getCheckpoint()).toEqual({ levelIndex: 3, x: 560, y: 320 });
  });

  it('completar nível limpa checkpoint do save persistido', () => {
    save.setCheckpoint(3, 560, 320);
    save.markLevelComplete(2);
    const next = new SaveSystem(storage);
    expect(next.getCheckpoint()).toBeNull();
  });

  it('checkpoint de outro nível ainda visível mas pode ser ignorado pelo GameScene', () => {
    save.setCheckpoint(2, 200, 100);
    const cp = save.getCheckpoint();
    expect(cp?.levelIndex).toBe(2);
  });

  it('powerUp adquirido persiste após reload', () => {
    save.setPowerUp('waterGun', true);
    const next = new SaveSystem(storage);
    expect(next.load().powerUps.waterGun).toBe(true);
  });

  it('powerUp + checkpoint coexistem no save', () => {
    save.setPowerUp('waterGun', true);
    save.setCheckpoint(2, 100, 200);
    const next = new SaveSystem(storage);
    const data = next.load();
    expect(data.powerUps.waterGun).toBe(true);
    expect(data.checkpoint).toEqual({ levelIndex: 2, x: 100, y: 200 });
  });

  it('progressão completa: completar L1 → desbloqueia L2 → checkpoint em L3 → completar L3 limpa cp', () => {
    save.markLevelComplete(0);
    expect(save.isLevelUnlocked(1)).toBe(true);
    save.markLevelComplete(1);
    save.setPowerUp('waterGun', true);
    expect(save.isLevelUnlocked(2)).toBe(true);
    save.setCheckpoint(3, 560, 320);
    expect(save.getCheckpoint()).not.toBeNull();
    save.markLevelComplete(2);
    expect(save.getCheckpoint()).toBeNull();
    expect(save.load().powerUps.waterGun).toBe(true);
  });
});
