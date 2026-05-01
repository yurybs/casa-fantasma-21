import { describe, it, expect } from 'vitest';
import { Player } from '../../src/entities/Player';
import { Skeleton } from '../../src/entities/enemies/Skeleton';
import { Zombie } from '../../src/entities/enemies/Zombie';
import { FoamGun } from '../../src/weapons/FoamGun';
import { CollisionSystem, AABB } from '../../src/systems/CollisionSystem';
import { Direction, ENEMY_SIZE, PROJECTILE_SIZE } from '../../src/types/GameTypes';

const projectileBox = (x: number, y: number): AABB => ({
  x: x - PROJECTILE_SIZE / 2,
  y: y - PROJECTILE_SIZE / 2,
  width: PROJECTILE_SIZE,
  height: PROJECTILE_SIZE,
});
const enemyBox = (x: number, y: number): AABB => ({
  x: x - ENEMY_SIZE / 2,
  y: y - ENEMY_SIZE / 2,
  width: ENEMY_SIZE,
  height: ENEMY_SIZE,
});

describe('Player ↔ Enemy interactions', () => {
  it('player toma dano ao colidir com inimigo (via takeDamage)', () => {
    const p = new Player();
    const z = new Zombie();
    p.takeDamage(z.damage);
    expect(p.hp).toBe(5);
  });

  it('projétil atinge inimigo e reduz HP', () => {
    const gun = new FoamGun();
    const skeleton = new Skeleton();
    skeleton.setPosition(50, 50);

    const proj = gun.fire(0, 50, Direction.Right);
    expect(proj).not.toBeNull();

    for (let i = 0; i < 30; i++) {
      gun.update(16);
      const colliding = CollisionSystem.intersects(
        projectileBox(proj!.x, proj!.y),
        enemyBox(skeleton.x, skeleton.y),
      );
      if (colliding) {
        skeleton.takeDamage(proj!.damage);
        gun.killProjectile(proj!.id);
        break;
      }
    }

    expect(skeleton.hp).toBe(2);
  });

  it('inimigo morre após dano suficiente e fica inerte', () => {
    const skeleton = new Skeleton();
    skeleton.takeDamage(skeleton.maxHp);
    expect(skeleton.isDead).toBe(true);
    skeleton.update(16);
    expect(skeleton.vx).toBe(0);
  });

  it('jogador derrotado não persegue input', () => {
    const p = new Player();
    p.takeDamage(p.maxHp);
    p.moveHorizontal(Direction.Right, 16);
    expect(p.vx).toBe(0);
  });

  it('coletar 100 moedas concede vida extra ao jogador', () => {
    const p = new Player();
    for (let i = 0; i < 100; i++) p.collectCoin();
    expect(p.lives).toBe(4);
  });

  it('zumbi persegue jogador apenas dentro do range', () => {
    const z = new Zombie();
    z.setPosition(0, 0);

    z.update(16, 500, 0);
    expect(z.isChasing).toBe(false);

    z.update(16, 100, 0);
    expect(z.isChasing).toBe(true);
  });

  it('esqueleto invertido por borda muda direção', () => {
    const skel = new Skeleton();
    expect(skel.facing).toBe(Direction.Left);
    skel.reportEdge(true);
    expect(skel.facing).toBe(Direction.Right);
  });
});
