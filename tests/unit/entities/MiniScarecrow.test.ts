import { describe, it, expect } from 'vitest';
import { MiniScarecrow } from '../../../src/entities/enemies/MiniScarecrow';
import { Direction } from '../../../src/types/GameTypes';

describe('MiniScarecrow', () => {
  it('inicia com 2 HP, tag normal e facing left', () => {
    const m = new MiniScarecrow();
    expect(m.hp).toBe(2);
    expect(m.tag).toBe('normal');
    expect(m.facing).toBe(Direction.Left);
  });

  it('vira para o lado do jogador quando dentro do range', () => {
    const m = new MiniScarecrow();
    m.setPosition(100, 100);
    m.update(16, 300, 100);
    expect(m.facing).toBe(Direction.Right);
  });

  it('mantém direção atual quando jogador fora do range', () => {
    const m = new MiniScarecrow();
    m.setPosition(100, 100);
    m.update(16, 5000, 100);
    expect(m.facing).toBe(Direction.Left);
  });

  it('vx aplicado conforme facing', () => {
    const m = new MiniScarecrow();
    m.setPosition(100, 100);
    m.update(16, 300, 100);
    expect(m.vx).toBeGreaterThan(0);
  });

  it('morre com 2 de dano', () => {
    const m = new MiniScarecrow();
    m.takeDamage(2);
    expect(m.isDead).toBe(true);
  });

  it('morto zera velocidade', () => {
    const m = new MiniScarecrow();
    m.takeDamage(99);
    m.update(16, 200, 100);
    expect(m.vx).toBe(0);
  });
});
