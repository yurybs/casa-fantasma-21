import { describe, it, expect } from 'vitest';
import { GhostBoss } from '../../src/entities/enemies/GhostBoss';
import { MiniGhost } from '../../src/entities/enemies/MiniGhost';
import { WaterGun } from '../../src/weapons/WaterGun';
import { Direction } from '../../src/types/GameTypes';

describe('Boss fight: GhostBoss + Player + WaterGun', () => {
  it('fluxo completo: WaterGun derrota o boss em metade dos tiros que o foam levaria', () => {
    const boss = new GhostBoss(400, 200);
    const water = new WaterGun();

    let shots = 0;
    while (!boss.isDead && shots < 20) {
      const p = water.fire(boss.x, boss.y, Direction.Right);
      if (p) {
        boss.takeDamage(WaterGun.damageFor(p, 'ghost'));
        shots += 1;
      }
      water.update(water.cooldownMs + 5);
    }

    expect(boss.isDead).toBe(true);
    expect(shots).toBe(GhostBoss.maxHp / 2);
  });

  it('phase2 spawn de minis cria 2 mini-fantasmas que perseguem o jogador', () => {
    let spawnedMinis: MiniGhost[] = [];
    const boss = new GhostBoss(400, 200, {
      onSpawnMinis: (spawns) => {
        spawnedMinis = spawns.map((s) => {
          const m = new MiniGhost();
          m.setPosition(s.x, s.y);
          return m;
        });
      },
    });
    boss.takeDamage(GhostBoss.maxHp - GhostBoss.phase2HpThreshold);
    expect(spawnedMinis).toHaveLength(2);

    const playerX = boss.x + 200;
    const playerY = boss.y;
    spawnedMinis[0].update(16, playerX, playerY);
    expect(spawnedMinis[0].vx).toBeGreaterThan(0);
  });

  it('boss em phase1 toma dano normal de água (2 por tiro)', () => {
    const boss = new GhostBoss(400, 200);
    const water = new WaterGun();
    const p = water.fire(boss.x, boss.y, Direction.Right);
    boss.takeDamage(WaterGun.damageFor(p!, 'ghost'));
    expect(boss.hp).toBe(GhostBoss.maxHp - 2);
  });

  it('mini-fantasma morto não pode mais atacar', () => {
    const m = new MiniGhost();
    m.setPosition(100, 100);
    const water = new WaterGun();
    const p = water.fire(100, 100, Direction.Right);
    m.takeDamage(WaterGun.damageFor(p!, 'ghost'));
    expect(m.isDead).toBe(true);
    m.update(16, 200, 200);
    expect(m.vx).toBe(0);
    expect(m.vy).toBe(0);
  });
});
