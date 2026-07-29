import { describe, it, expect } from 'vitest';
import { MiniOctopus } from '../../../src/entities/enemies/MiniOctopus';
import { Direction } from '../../../src/types/GameTypes';

describe('MiniOctopus', () => {
  it('inicia com 2 HP, tag normal e dano 1', () => {
    const m = new MiniOctopus();
    expect(m.hp).toBe(2);
    expect(m.maxHp).toBe(2);
    expect(m.tag).toBe('normal');
    expect(m.damage).toBe(1);
  });

  it('persegue o jogador quando dentro do range', () => {
    const m = new MiniOctopus();
    m.setPosition(200, 200);
    m.update(16, 260, 200);
    expect(m.isChasing).toBe(true);
    expect(m.facing).toBe(Direction.Right);
    expect(Math.abs(m.vx)).toBe(m.speed);
  });

  it('vira para a esquerda quando jogador está à esquerda', () => {
    const m = new MiniOctopus();
    m.setPosition(300, 200);
    m.update(16, 100, 200);
    expect(m.facing).toBe(Direction.Left);
    expect(m.vx).toBeLessThan(0);
  });

  it('patrulha em velocidade reduzida fora do range', () => {
    const m = new MiniOctopus();
    m.setPosition(0, 200);
    m.update(16, 800, 200);
    expect(m.isChasing).toBe(false);
    expect(Math.abs(m.vx)).toBeLessThan(m.speed);
    expect(Math.abs(m.vx)).toBeGreaterThan(0);
  });

  it('morre com 2 de dano', () => {
    const m = new MiniOctopus();
    m.takeDamage(1);
    expect(m.isDead).toBe(false);
    m.takeDamage(1);
    expect(m.isDead).toBe(true);
  });

  it('morto zera velocidade', () => {
    const m = new MiniOctopus();
    m.takeDamage(99);
    m.update(16, 200, 200);
    expect(m.vx).toBe(0);
  });

  it('detection range é 240', () => {
    expect(MiniOctopus.detectionRange).toBe(240);
  });
});
