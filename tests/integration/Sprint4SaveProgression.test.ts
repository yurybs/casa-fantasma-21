import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem, StorageLike } from '../../src/systems/SaveSystem';
import { MAX_EXTRA_HEARTS } from '../../src/types/GameTypes';

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

describe('Sprint 4 — save progression: Mundo 2 unlock + extraHearts', () => {
  let storage: MemoryStorage;
  let save: SaveSystem;

  beforeEach(() => {
    storage = new MemoryStorage();
    save = new SaveSystem(storage);
  });

  it('completar Level 3 desbloqueia Level 4 (entrada do Mundo 2)', () => {
    save.markLevelComplete(0);
    save.markLevelComplete(1);
    save.markLevelComplete(2);
    expect(save.isLevelUnlocked(3)).toBe(true);
  });

  it('progressão completa Mundo 1 → Mundo 2 mantém powerUps adquiridos', () => {
    save.setPowerUp('waterGun', true);
    save.markLevelComplete(0);
    save.markLevelComplete(1);
    save.markLevelComplete(2);
    save.addExtraHeart();
    save.markLevelComplete(3);
    expect(save.load().powerUps.waterGun).toBe(true);
    expect(save.load().powerUps.extraHearts).toBe(1);
  });

  it('addExtraHeart respeita o limite MAX_EXTRA_HEARTS', () => {
    for (let i = 0; i < 5; i++) save.addExtraHeart();
    expect(save.load().powerUps.extraHearts).toBe(MAX_EXTRA_HEARTS);
  });

  it('extraHearts persiste entre instâncias (mesmo storage)', () => {
    save.addExtraHeart();
    save.addExtraHeart();
    const fresh = new SaveSystem(storage);
    expect(fresh.load().powerUps.extraHearts).toBe(2);
  });

  it('save antigo (sem extraHearts) carrega com 0', () => {
    storage.setItem(
      'toy-blaster-kid:save',
      JSON.stringify({
        currentLevel: 4,
        lives: 2,
        coins: 30,
        levelsCompleted: [true, true, true, ...new Array(18).fill(false)],
        highScore: 0,
        checkpoint: null,
        powerUps: { waterGun: true },
      }),
    );
    const data = save.load();
    expect(data.powerUps.extraHearts).toBe(0);
    expect(data.powerUps.waterGun).toBe(true);
  });

  it('todos os 6 níveis completos após progressão completa do Mundo 1+2', () => {
    for (let i = 0; i < 6; i++) save.markLevelComplete(i);
    const data = save.load();
    for (let i = 0; i < 6; i++) {
      expect(data.levelsCompleted[i]).toBe(true);
    }
    // Level 7+ ainda não foi implementado, mas o índice 20 (level 21) deve continuar bloqueado.
    expect(save.isLevelUnlocked(20)).toBe(false);
  });
});
