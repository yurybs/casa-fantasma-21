import { describe, it, expect } from 'vitest';
import { MiniVampire } from '../../../src/entities/enemies/MiniVampire';
import { Direction } from '../../../src/types/GameTypes';

describe('MiniVampire', () => {
  it('inicia com 2 HP, dano 1 e tag ghost (água causa 2x)', () => {
    const m = new MiniVampire();
    expect(m.hp).toBe(2);
    expect(m.damage).toBe(1);
    expect(m.tag).toBe('ghost');
  });

  it('persegue o jogador dentro do alcance de detecção', () => {
    const m = new MiniVampire();
    m.setPosition(100, 100);
    m.update(16, 100 + MiniVampire.detectionRange - 10, 100);
    expect(m.isChasing).toBe(true);
    expect(m.facing).toBe(Direction.Right);
    expect(m.vx).toBeGreaterThan(0);
  });

  it('deriva devagar fora do alcance', () => {
    const m = new MiniVampire();
    m.setPosition(100, 100);
    m.update(16, 100 + MiniVampire.detectionRange + 200, 100);
    expect(m.isChasing).toBe(false);
    expect(Math.abs(m.vx)).toBeLessThan(m.speed);
  });

  it('tem bob vertical senoidal', () => {
    const m = new MiniVampire();
    m.setPosition(100, 100);
    const vys = new Set<number>();
    for (let i = 0; i < 60; i++) {
      m.update(16, 1000, 100);
      vys.add(Math.round(m.vy));
    }
    // vy varies over time — not constant
    expect(vys.size).toBeGreaterThan(1);
  });

  it('morre com 2 hits', () => {
    const m = new MiniVampire();
    expect(m.takeDamage(1)).toBe(false);
    expect(m.takeDamage(1)).toBe(true);
    expect(m.isDead).toBe(true);
  });

  it('morto zera velocidades', () => {
    const m = new MiniVampire();
    m.setPosition(100, 100);
    m.takeDamage(2);
    m.update(16, 200, 100);
    expect(m.vx).toBe(0);
    expect(m.vy).toBe(0);
  });
});
