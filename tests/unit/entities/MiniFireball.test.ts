import { describe, it, expect } from 'vitest';
import { MiniFireball } from '../../../src/entities/enemies/MiniFireball';
import { Direction } from '../../../src/types/GameTypes';

describe('MiniFireball', () => {
  it('inicia com 1 HP, tag ghost e dano 1', () => {
    const m = new MiniFireball();
    expect(m.hp).toBe(1);
    expect(m.tag).toBe('ghost');
    expect(m.damage).toBe(1);
  });

  it('persegue o jogador quando dentro do range', () => {
    const m = new MiniFireball();
    m.setPosition(200, 200);
    m.update(16, 260, 200);
    expect(m.isChasing).toBe(true);
    expect(m.facing).toBe(Direction.Right);
    expect(m.vx).toBeGreaterThan(0);
  });

  it('vira para a esquerda quando jogador está à esquerda', () => {
    const m = new MiniFireball();
    m.setPosition(300, 200);
    m.update(16, 100, 200);
    expect(m.facing).toBe(Direction.Left);
    expect(m.vx).toBeLessThan(0);
  });

  it('drift mais lento quando fora do range', () => {
    const m = new MiniFireball();
    m.setPosition(0, 200);
    m.update(16, 900, 200);
    expect(m.isChasing).toBe(false);
    expect(Math.abs(m.vx)).toBeLessThan(m.speed);
  });

  it('morre em um único hit', () => {
    const m = new MiniFireball();
    expect(m.takeDamage(1)).toBe(true);
    expect(m.isDead).toBe(true);
  });

  it('detection range é 300', () => {
    expect(MiniFireball.detectionRange).toBe(300);
  });
});
