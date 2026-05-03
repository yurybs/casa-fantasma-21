import { describe, it, expect } from 'vitest';
import { WaterGun } from '../../../src/weapons/WaterGun';
import { Direction } from '../../../src/types/GameTypes';

describe('WaterGun', () => {
  it('dispara projétil com damage=1 e damageVsGhost=2', () => {
    const w = new WaterGun();
    const p = w.fire(100, 100, Direction.Right);
    expect(p).not.toBeNull();
    expect(p!.damage).toBe(1);
    expect(p!.damageVsGhost).toBe(2);
  });

  it('damageFor retorna damage=1 contra normal', () => {
    const w = new WaterGun();
    const p = w.fire(100, 100, Direction.Right);
    expect(WaterGun.damageFor(p!, 'normal')).toBe(1);
  });

  it('damageFor retorna damage=2 contra ghost', () => {
    const w = new WaterGun();
    const p = w.fire(100, 100, Direction.Right);
    expect(WaterGun.damageFor(p!, 'ghost')).toBe(2);
  });

  it('cooldown impede tiros consecutivos', () => {
    const w = new WaterGun();
    expect(w.fire(100, 100, Direction.Right)).not.toBeNull();
    expect(w.fire(100, 100, Direction.Right)).toBeNull();
  });

  it('cooldown expira e permite novo tiro', () => {
    const w = new WaterGun();
    w.fire(100, 100, Direction.Right);
    w.update(w.cooldownMs + 10);
    expect(w.fire(100, 100, Direction.Right)).not.toBeNull();
  });

  it('projétil avança na direção do facing', () => {
    const w = new WaterGun();
    const p = w.fire(100, 100, Direction.Left);
    w.update(100);
    expect(p!.x).toBeLessThan(100);
  });

  it('projétil expira após TTL', () => {
    const w = new WaterGun();
    w.fire(100, 100, Direction.Right);
    w.update(2000);
    expect(w.projectiles).toHaveLength(0);
  });

  it('reset limpa projéteis e cooldown', () => {
    const w = new WaterGun();
    w.fire(100, 100, Direction.Right);
    w.reset();
    expect(w.projectiles).toHaveLength(0);
    expect(w.canFire()).toBe(true);
  });

  it('killProjectile marca o projétil como morto', () => {
    const w = new WaterGun();
    const p = w.fire(100, 100, Direction.Right);
    w.killProjectile(p!.id);
    w.update(16);
    expect(w.projectiles).toHaveLength(0);
  });
});
