import { describe, it, expect } from 'vitest';
import { MiniGhost } from '../../../src/entities/enemies/MiniGhost';
import { Direction } from '../../../src/types/GameTypes';

describe('MiniGhost', () => {
  it('inicia com 1 HP e tag ghost', () => {
    const m = new MiniGhost();
    expect(m.hp).toBe(1);
    expect(m.tag).toBe('ghost');
  });

  it('persegue o jogador na direção horizontal', () => {
    const m = new MiniGhost();
    m.setPosition(100, 100);
    m.update(16, 200, 100);
    expect(m.vx).toBeGreaterThan(0);
    expect(m.facing).toBe(Direction.Right);
  });

  it('persegue o jogador na direção vertical (sobe)', () => {
    const m = new MiniGhost();
    m.setPosition(100, 200);
    m.update(16, 100, 100);
    expect(m.vy).toBeLessThan(0);
  });

  it('morre em um único hit', () => {
    const m = new MiniGhost();
    m.takeDamage(1);
    expect(m.isDead).toBe(true);
  });

  it('morto zera velocidade', () => {
    const m = new MiniGhost();
    m.takeDamage(1);
    m.update(16, 200, 200);
    expect(m.vx).toBe(0);
    expect(m.vy).toBe(0);
  });
});
