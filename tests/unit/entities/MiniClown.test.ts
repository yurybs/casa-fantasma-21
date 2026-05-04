import { describe, it, expect } from 'vitest';
import { MiniClown } from '../../../src/entities/enemies/MiniClown';
import { Direction } from '../../../src/types/GameTypes';

describe('MiniClown', () => {
  it('inicia com 1 HP e tag normal', () => {
    const m = new MiniClown();
    expect(m.hp).toBe(1);
    expect(m.tag).toBe('normal');
  });

  it('persegue o jogador horizontalmente quando dentro do range', () => {
    const m = new MiniClown();
    m.setPosition(100, 100);
    m.isOnGround = true;
    m.update(16, 300, 100);
    expect(m.facing).toBe(Direction.Right);
    expect(m.vx).toBeGreaterThan(0);
  });

  it('para quando jogador está fora do range de detecção', () => {
    const m = new MiniClown();
    m.setPosition(100, 100);
    m.update(16, 1000, 100);
    expect(m.vx).toBe(0);
  });

  it('pula (vy negativo) quando isOnGround após hopIntervalMs', () => {
    const m = new MiniClown();
    m.setPosition(100, 100);
    m.isOnGround = true;
    m.update(MiniClown.hopIntervalMs + 10, 200, 100);
    expect(m.vy).toBeLessThan(0);
    expect(m.isOnGround).toBe(false);
  });

  it('não pula no ar', () => {
    const m = new MiniClown();
    m.setPosition(100, 100);
    m.isOnGround = false;
    m.update(MiniClown.hopIntervalMs + 10, 200, 100);
    expect(m.vy).toBeGreaterThanOrEqual(0);
  });

  it('morre em um único hit', () => {
    const m = new MiniClown();
    m.takeDamage(1);
    expect(m.isDead).toBe(true);
  });

  it('morto zera velocidade', () => {
    const m = new MiniClown();
    m.takeDamage(1);
    m.update(16, 200, 100);
    expect(m.vx).toBe(0);
  });
});
