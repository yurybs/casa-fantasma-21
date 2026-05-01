import { describe, it, expect, vi } from 'vitest';
import { Player } from '../../src/entities/Player';
import { SaveSystem } from '../../src/systems/SaveSystem';
import { DEFAULT_PLAYER_STATS } from '../../src/types/GameTypes';

class MemStorage {
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

describe('Game flow', () => {
  it('jogador com 0 vidas dispara onGameOver', () => {
    const onGameOver = vi.fn();
    const p = new Player({ onGameOver }, { ...DEFAULT_PLAYER_STATS, startingLives: 1 });
    p.takeDamage(p.maxHp);
    expect(onGameOver).toHaveBeenCalledTimes(1);
  });

  it('jogador respawn após perder vida (vidas > 0)', () => {
    const p = new Player();
    p.takeDamage(p.maxHp);
    expect(p.lives).toBe(2);
    p.respawn();
    expect(p.hp).toBe(p.maxHp);
    expect(p.isDead).toBe(false);
  });

  it('reiniciar após game over reseta vidas via novo Player', () => {
    const p1 = new Player({}, { ...DEFAULT_PLAYER_STATS, startingLives: 1 });
    p1.takeDamage(p1.maxHp);
    expect(p1.lives).toBe(0);

    const p2 = new Player();
    expect(p2.lives).toBe(3);
  });

  it('completar nível persiste no save', () => {
    const save = new SaveSystem(new MemStorage());
    const data = save.markLevelComplete(0);
    expect(data.levelsCompleted[0]).toBe(true);
  });

  it('save preserva moedas entre sessões', () => {
    const storage = new MemStorage();
    const save1 = new SaveSystem(storage);
    save1.updateLivesAndCoins(3, 75);

    const save2 = new SaveSystem(storage);
    expect(save2.load().coins).toBe(75);
  });

  it('reset save retorna estado padrão no próximo load', () => {
    const storage = new MemStorage();
    const save1 = new SaveSystem(storage);
    save1.updateLivesAndCoins(1, 99);
    save1.clear();
    const save2 = new SaveSystem(storage);
    expect(save2.load().coins).toBe(0);
  });

  it('cooldown de tiro respeita o intervalo entre disparos', () => {
    const p = new Player();
    expect(p.shoot()).toBe(true);
    expect(p.shoot()).toBe(false);
    p.update(p.getStats().shootCooldownMs);
    expect(p.shoot()).toBe(true);
  });

  it('invencibilidade impede dano por contato repetido', () => {
    const p = new Player();
    expect(p.takeDamage(1)).toBe(true);
    expect(p.takeDamage(1)).toBe(false);
    p.update(p.getStats().invincibilityMs);
    expect(p.takeDamage(1)).toBe(true);
  });
});
