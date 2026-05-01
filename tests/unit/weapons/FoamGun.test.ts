import { describe, it, expect } from 'vitest';
import { FoamGun } from '../../../src/weapons/FoamGun';
import { Direction } from '../../../src/types/GameTypes';

describe('FoamGun', () => {
  it('canFire retorna true por padrão', () => {
    const g = new FoamGun();
    expect(g.canFire()).toBe(true);
  });

  it('fire() cria projétil na direção correta para a direita', () => {
    const g = new FoamGun();
    const proj = g.fire(100, 200, Direction.Right);
    expect(proj).not.toBeNull();
    expect(proj!.x).toBe(100);
    expect(proj!.y).toBe(200);
    expect(proj!.vx).toBeGreaterThan(0);
    expect(proj!.alive).toBe(true);
  });

  it('fire() cria projétil para a esquerda', () => {
    const g = new FoamGun();
    const proj = g.fire(100, 200, Direction.Left);
    expect(proj!.vx).toBeLessThan(0);
  });

  it('cooldown impede disparo imediato', () => {
    const g = new FoamGun();
    g.fire(0, 0, Direction.Right);
    expect(g.canFire()).toBe(false);
    expect(g.fire(0, 0, Direction.Right)).toBeNull();
  });

  it('cooldown expira após cooldownMs', () => {
    const g = new FoamGun();
    g.fire(0, 0, Direction.Right);
    g.update(g.cooldownMs);
    expect(g.canFire()).toBe(true);
  });

  it('projétil aplica 1 dano', () => {
    const g = new FoamGun();
    const proj = g.fire(0, 0, Direction.Right);
    expect(proj!.damage).toBe(1);
  });

  it('update move o projétil', () => {
    const g = new FoamGun();
    const proj = g.fire(0, 0, Direction.Right);
    const initialX = proj!.x;
    g.update(100);
    expect(proj!.x).toBeGreaterThan(initialX);
  });

  it('projétil expira após TTL', () => {
    const g = new FoamGun();
    g.fire(0, 0, Direction.Right);
    g.update(2000);
    expect(g.projectiles.length).toBe(0);
  });

  it('killProjectile marca como morto', () => {
    const g = new FoamGun();
    const proj = g.fire(0, 0, Direction.Right);
    g.killProjectile(proj!.id);
    g.update(16);
    expect(g.projectiles.length).toBe(0);
  });

  it('cada projétil tem id único', () => {
    const g = new FoamGun();
    const p1 = g.fire(0, 0, Direction.Right);
    g.update(g.cooldownMs);
    const p2 = g.fire(0, 0, Direction.Right);
    expect(p1!.id).not.toBe(p2!.id);
  });

  it('reset limpa projéteis e cooldown', () => {
    const g = new FoamGun();
    g.fire(0, 0, Direction.Right);
    g.reset();
    expect(g.projectiles.length).toBe(0);
    expect(g.canFire()).toBe(true);
  });
});
