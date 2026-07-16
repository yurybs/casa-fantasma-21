import { describe, it, expect, vi } from 'vitest';
import { VampireBoss, BatSpawn } from '../../src/entities/enemies/VampireBoss';
import { Bat } from '../../src/entities/enemies/Bat';
import { MiniVampire } from '../../src/entities/enemies/MiniVampire';
import { Player } from '../../src/entities/Player';
import { WaterGun } from '../../src/weapons/WaterGun';
import { Direction } from '../../src/types/GameTypes';

const stepBoss = (
  boss: VampireBoss,
  predicate: () => boolean,
  maxMs = 30000,
  stepMs = 16,
  playerX = 100,
  playerY = 300,
): number => {
  let elapsed = 0;
  while (elapsed < maxMs && !predicate()) {
    boss.update(stepMs, playerX, playerY);
    elapsed += stepMs;
  }
  return elapsed;
};

describe('Sprint 6 — Vampire flow integration', () => {
  it('acertos do boss no jogador alimentam o lifesteal e curam o boss', () => {
    const boss = new VampireBoss(400, 120);
    const player = new Player();
    boss.takeDamage(6);
    const bossHpBefore = boss.hp;

    // Simulate 3 boss contacts, honoring the player's i-frames like the scene does
    let hits = 0;
    while (hits < VampireBoss.hitsPerLifesteal) {
      const damaged = player.takeDamage(boss.damage);
      if (damaged) {
        boss.registerHitOnPlayer();
        hits++;
      }
      // Advance past invincibility between contacts
      player.update(2000);
    }

    expect(boss.hp).toBe(bossHpBefore + VampireBoss.lifestealAmount);
    expect(player.hp).toBeLessThan(player.maxHp);
  });

  it('projétil de água causa 2x no vampiro (tag ghost) e bloqueia lifesteal', () => {
    const boss = new VampireBoss(400, 120);
    const gun = new WaterGun();
    const proj = gun.fire(100, 100, Direction.Right);
    expect(proj).not.toBeNull();
    if (!proj) return;

    const dmg = WaterGun.damageFor(proj, boss.tag);
    expect(dmg).toBe(proj.damageVsGhost);

    const hpBefore = boss.hp;
    boss.takeDamage(dmg);
    boss.blockLifesteal(); // the scene blocks on water hit
    expect(boss.hp).toBe(hpBefore - proj.damageVsGhost);
    expect(boss.isLifestealBlocked).toBe(true);

    // Blocked hits don't heal
    const hpAfterHit = boss.hp;
    for (let i = 0; i < 6; i++) boss.registerHitOnPlayer();
    expect(boss.hp).toBe(hpAfterHit);
  });

  it('bloqueio expira e o lifesteal volta a funcionar', () => {
    const boss = new VampireBoss(400, 120);
    boss.takeDamage(6);
    boss.blockLifesteal();
    stepBoss(boss, () => !boss.isLifestealBlocked, VampireBoss.lifestealBlockMs + 2000);
    expect(boss.isLifestealBlocked).toBe(false);

    const hpBefore = boss.hp;
    for (let i = 0; i < VampireBoss.hitsPerLifesteal; i++) boss.registerHitOnPlayer();
    expect(boss.hp).toBe(hpBefore + VampireBoss.lifestealAmount);
  });

  it('phase 2: transformação acelera o boss e spawna minis que perseguem', () => {
    const onSpawnMiniVampires = vi.fn();
    const boss = new VampireBoss(400, 120, { onSpawnMiniVampires });
    boss.takeDamage(VampireBoss.maxHpValue - VampireBoss.phase2HpThreshold);
    expect(boss.phase).toBe('phase2');

    boss.update(16, 100, 300);
    expect(Math.abs(boss.vx)).toBe(
      VampireBoss.hoverSpeed * VampireBoss.phase2SpeedMultiplier,
    );

    const spawns = onSpawnMiniVampires.mock.calls[0][0];
    const mini = new MiniVampire();
    mini.setPosition(spawns[0].x, spawns[0].y);
    mini.update(16, spawns[0].x + 100, spawns[0].y);
    expect(mini.isChasing).toBe(true);
  });

  it('morcegos lançados pelo boss perseguem o jogador e seus acertos contam para o lifesteal', () => {
    let batSpawns: BatSpawn[] = [];
    const boss = new VampireBoss(400, 120, { onSpawnBats: (s) => (batSpawns = s) });
    stepBoss(boss, () => batSpawns.length > 0);
    expect(batSpawns.length).toBeGreaterThan(0);

    const bat = new Bat();
    bat.setPosition(batSpawns[0].x, batSpawns[0].y);
    const player = new Player();
    // Bat homes toward the player position
    for (let i = 0; i < 60; i++) bat.update(16, 100, 300);
    expect(bat.vx).toBeLessThan(0); // player is to the left

    // Bat hit feeds boss lifesteal counter
    boss.takeDamage(6);
    const hpBefore = boss.hp;
    for (let i = 0; i < VampireBoss.hitsPerLifesteal; i++) {
      const damaged = player.takeDamage(bat.damage);
      if (damaged) boss.registerHitOnPlayer();
      player.update(2000);
    }
    expect(boss.hp).toBe(hpBefore + VampireBoss.lifestealAmount);
  });

  it('luta completa: derrotar o vampiro passando pelas duas fases', () => {
    const phases: string[] = [];
    const boss = new VampireBoss(400, 120, {
      onPhaseChange: (p) => phases.push(p),
    });
    // Chip damage until dead, stepping the boss between shots
    let shots = 0;
    while (!boss.isDead && shots < 100) {
      boss.takeDamage(1);
      boss.update(16, 100, 300);
      shots++;
    }
    expect(boss.isDead).toBe(true);
    expect(phases).toContain('phase2');
    expect(shots).toBe(VampireBoss.maxHpValue);
  });
});
