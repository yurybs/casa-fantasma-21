import { describe, it, expect } from 'vitest';
import { Zombie } from '../../../src/entities/enemies/Zombie';
import { Direction } from '../../../src/types/GameTypes';

describe('Zombie', () => {
  it('inicia com 5 HP', () => {
    const z = new Zombie();
    expect(z.hp).toBe(5);
  });

  it('permanece parado se jogador estiver fora do range', () => {
    const z = new Zombie();
    z.setPosition(0, 0);
    z.update(16, 500, 0);
    expect(z.isChasing).toBe(false);
    expect(z.vx).toBe(0);
  });

  it('persegue jogador quando dentro do range', () => {
    const z = new Zombie();
    z.setPosition(0, 0);
    z.update(16, 100, 0);
    expect(z.isChasing).toBe(true);
    expect(z.facing).toBe(Direction.Right);
    expect(z.vx).toBeGreaterThan(0);
  });

  it('vira para a esquerda se jogador estiver à esquerda', () => {
    const z = new Zombie();
    z.setPosition(200, 0);
    z.update(16, 100, 0);
    expect(z.facing).toBe(Direction.Left);
    expect(z.vx).toBeLessThan(0);
  });

  it('morre quando HP chega a 0', () => {
    const z = new Zombie();
    z.takeDamage(5);
    expect(z.isDead).toBe(true);
  });

  it('detection range é 200', () => {
    expect(Zombie.detectionRange).toBe(200);
  });

  it('limite exato do range = ainda persegue', () => {
    const z = new Zombie();
    z.setPosition(0, 0);
    z.update(16, 200, 0);
    expect(z.isChasing).toBe(true);
  });

  it('zombie morto não persegue', () => {
    const z = new Zombie();
    z.takeDamage(99);
    z.setPosition(0, 0);
    z.update(16, 50, 0);
    expect(z.vx).toBe(0);
  });
});
