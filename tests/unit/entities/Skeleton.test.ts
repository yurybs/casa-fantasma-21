import { describe, it, expect, vi } from 'vitest';
import { Skeleton } from '../../../src/entities/enemies/Skeleton';
import { Direction } from '../../../src/types/GameTypes';

describe('Skeleton', () => {
  it('inicia com 3 HP', () => {
    const s = new Skeleton();
    expect(s.hp).toBe(3);
    expect(s.maxHp).toBe(3);
  });

  it('inicia patrulhando para a esquerda', () => {
    const s = new Skeleton();
    expect(s.facing).toBe(Direction.Left);
  });

  it('takeDamage() reduz HP', () => {
    const s = new Skeleton();
    s.takeDamage(1);
    expect(s.hp).toBe(2);
  });

  it('morre quando HP chega a 0', () => {
    const onDeath = vi.fn();
    const s = new Skeleton({ onDeath });
    s.takeDamage(3);
    expect(s.isDead).toBe(true);
    expect(onDeath).toHaveBeenCalled();
  });

  it('inverte direção ao reportar borda à frente', () => {
    const s = new Skeleton();
    s.reportEdge(true);
    expect(s.facing).toBe(Direction.Right);
  });

  it('lança projétil a cada 2s', () => {
    const onShoot = vi.fn();
    const s = new Skeleton({ onShoot });
    s.update(1999);
    expect(onShoot).not.toHaveBeenCalled();
    s.update(2);
    expect(onShoot).toHaveBeenCalledTimes(1);
  });

  it('projétil emitido tem direção do esqueleto', () => {
    const onShoot = vi.fn();
    const s = new Skeleton({ onShoot });
    s.update(2001);
    const projectile = onShoot.mock.calls[0][0];
    expect(projectile.vx).toBeLessThan(0);
  });

  it('vx aplicado conforme facing', () => {
    const s = new Skeleton();
    s.update(16);
    expect(s.vx).toBeLessThan(0);
    s.flipDirection();
    s.update(16);
    expect(s.vx).toBeGreaterThan(0);
  });

  it('morto não atualiza velocidade', () => {
    const s = new Skeleton();
    s.takeDamage(99);
    s.update(16);
    expect(s.vx).toBe(0);
  });

  it('ignora dano se já estiver morto', () => {
    const onDeath = vi.fn();
    const s = new Skeleton({ onDeath });
    s.takeDamage(99);
    s.takeDamage(99);
    expect(onDeath).toHaveBeenCalledTimes(1);
  });

  it('takeDamage com 0 ou negativo retorna false', () => {
    const s = new Skeleton();
    expect(s.takeDamage(0)).toBe(false);
    expect(s.takeDamage(-5)).toBe(false);
    expect(s.hp).toBe(3);
  });
});
