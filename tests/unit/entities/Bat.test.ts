import { describe, it, expect } from 'vitest';
import { Bat } from '../../../src/entities/enemies/Bat';
import { Direction } from '../../../src/types/GameTypes';

describe('Bat', () => {
  it('inicia com 1 HP, dano 1 e tag normal', () => {
    const bat = new Bat();
    expect(bat.hp).toBe(1);
    expect(bat.damage).toBe(1);
    expect(bat.tag).toBe('normal');
  });

  it('acelera na direção do jogador (teleguiado)', () => {
    const bat = new Bat();
    bat.setPosition(100, 100);
    // Player to the right and below
    bat.update(16, 400, 300);
    expect(bat.vx).toBeGreaterThan(0);
    expect(bat.facing).toBe(Direction.Right);
  });

  it('vira quando o jogador está à esquerda', () => {
    const bat = new Bat();
    bat.setPosition(500, 100);
    bat.update(16, 100, 100);
    expect(bat.vx).toBeLessThan(0);
    expect(bat.facing).toBe(Direction.Left);
  });

  it('velocidade total é limitada ao máximo', () => {
    const bat = new Bat();
    bat.setPosition(0, 0);
    // Many updates chasing a distant target build up speed
    for (let i = 0; i < 300; i++) {
      bat.update(16, 5000, 0);
    }
    const speed = Math.hypot(bat.vx, bat.vy);
    // Wobble adds a small vertical component on top of the cap
    expect(speed).toBeLessThanOrEqual(Bat.maxSpeed * 1.25);
  });

  it('persegue verticalmente também', () => {
    const bat = new Bat();
    bat.setPosition(100, 0);
    let vyAccum = 0;
    for (let i = 0; i < 30; i++) {
      bat.update(16, 100, 500);
      vyAccum += bat.vy;
    }
    expect(vyAccum).toBeGreaterThan(0);
  });

  it('morre com um único hit', () => {
    const bat = new Bat();
    const died = bat.takeDamage(1);
    expect(died).toBe(true);
    expect(bat.isDead).toBe(true);
  });

  it('morto zera velocidades', () => {
    const bat = new Bat();
    bat.setPosition(100, 100);
    bat.update(16, 400, 300);
    bat.takeDamage(1);
    bat.update(16, 400, 300);
    expect(bat.vx).toBe(0);
    expect(bat.vy).toBe(0);
  });
});
