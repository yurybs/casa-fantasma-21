import { describe, it, expect } from 'vitest';
import { MiniTRex } from '../../../src/entities/enemies/MiniTRex';
import { Direction } from '../../../src/types/GameTypes';

describe('MiniTRex', () => {
  it('inicia com 2 HP, tag normal e damage 1', () => {
    const m = new MiniTRex();
    expect(m.hp).toBe(2);
    expect(m.maxHp).toBe(2);
    expect(m.tag).toBe('normal');
    expect(m.damage).toBe(1);
  });

  it('persegue jogador quando dentro do range de detecção', () => {
    const m = new MiniTRex();
    m.setPosition(200, 200);
    m.update(16, 250, 200);
    expect(m.isChasing).toBe(true);
    expect(m.facing).toBe(Direction.Right);
    expect(m.vx).toBeGreaterThan(0);
    expect(Math.abs(m.vx)).toBe(m.speed);
  });

  it('vira para esquerda quando jogador está à esquerda', () => {
    const m = new MiniTRex();
    m.setPosition(300, 200);
    m.update(16, 100, 200);
    expect(m.facing).toBe(Direction.Left);
    expect(m.vx).toBeLessThan(0);
  });

  it('patrulha em velocidade reduzida quando fora do range', () => {
    const m = new MiniTRex();
    m.setPosition(0, 200);
    m.update(16, 800, 200); // longe do alcance
    expect(m.isChasing).toBe(false);
    expect(Math.abs(m.vx)).toBeLessThan(m.speed);
    expect(Math.abs(m.vx)).toBeGreaterThan(0);
  });

  it('morre com 2 de dano', () => {
    const m = new MiniTRex();
    m.takeDamage(1);
    expect(m.isDead).toBe(false);
    m.takeDamage(1);
    expect(m.isDead).toBe(true);
  });

  it('morto zera velocidade', () => {
    const m = new MiniTRex();
    m.takeDamage(99);
    m.update(16, 200, 200);
    expect(m.vx).toBe(0);
  });

  it('detection range é 280', () => {
    expect(MiniTRex.detectionRange).toBe(280);
  });
});
