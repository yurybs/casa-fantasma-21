import { describe, it, expect } from 'vitest';
import { WaterGun } from '../../src/weapons/WaterGun';
import { FoamGun } from '../../src/weapons/FoamGun';
import { Skeleton } from '../../src/entities/enemies/Skeleton';
import { GhostBoss } from '../../src/entities/enemies/GhostBoss';
import { SpiderGhost } from '../../src/entities/enemies/SpiderGhost';
import { Direction, EnemyTag } from '../../src/types/GameTypes';

describe('WaterGun damage routing', () => {
  it('água + ghost: 2x dano', () => {
    const w = new WaterGun();
    const p = w.fire(0, 0, Direction.Right);
    expect(WaterGun.damageFor(p!, 'ghost')).toBe(2);
  });

  it('água + normal: 1x dano (sem bônus)', () => {
    const w = new WaterGun();
    const p = w.fire(0, 0, Direction.Right);
    expect(WaterGun.damageFor(p!, 'normal')).toBe(1);
  });

  it('comparação: foam contra esqueleto preserva dano original', () => {
    const f = new FoamGun();
    const s = new Skeleton();
    const p = f.fire(0, 0, Direction.Right);
    s.takeDamage(p!.damage);
    expect(s.hp).toBe(2);
  });

  it('water gun derruba SpiderGhost em 1 tiro (2 hp / 2 dmg)', () => {
    const w = new WaterGun();
    const s = new SpiderGhost(80);
    const p = w.fire(0, 0, Direction.Right);
    s.takeDamage(WaterGun.damageFor(p!, 'ghost'));
    expect(s.isDead).toBe(true);
  });

  it('foam contra SpiderGhost precisa 2 tiros (1 dmg cada)', () => {
    const f = new FoamGun();
    const s = new SpiderGhost(80);
    let p = f.fire(0, 0, Direction.Right);
    s.takeDamage(p!.damage);
    f.update(f.cooldownMs + 5);
    p = f.fire(0, 0, Direction.Right);
    s.takeDamage(p!.damage);
    expect(s.isDead).toBe(true);
  });

  it('water gun: dano contra GhostBoss (12 hp) → 6 tiros', () => {
    const w = new WaterGun();
    const boss = new GhostBoss(400, 200);
    let shots = 0;
    while (!boss.isDead && shots < 12) {
      const p = w.fire(0, 0, Direction.Right);
      if (p) {
        boss.takeDamage(WaterGun.damageFor(p, 'ghost'));
        shots += 1;
      }
      w.update(w.cooldownMs + 5);
    }
    // 12 HP ÷ 2 (water double-damage vs ghost) = 6 shots.
    expect(shots).toBe(6);
    expect(boss.isDead).toBe(true);
  });

  it('damageFor tratamento de tag tipado', () => {
    const w = new WaterGun();
    const p = w.fire(0, 0, Direction.Right);
    const tags: EnemyTag[] = ['normal', 'ghost'];
    const damages = tags.map((t) => WaterGun.damageFor(p!, t));
    expect(damages).toEqual([1, 2]);
  });
});
