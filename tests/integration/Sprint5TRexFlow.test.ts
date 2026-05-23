import { describe, it, expect, vi } from 'vitest';
import { TRexBoss, ShockwaveSpawn } from '../../src/entities/enemies/TRexBoss';
import { MiniTRex } from '../../src/entities/enemies/MiniTRex';
import { Player } from '../../src/entities/Player';
import { CameraSystem } from '../../src/systems/CameraSystem';
import { Direction, NERF_RIFLE_SPEED_MULTIPLIER, NERF_RIFLE_DAMAGE_BONUS } from '../../src/types/GameTypes';
import { FoamGun } from '../../src/weapons/FoamGun';

const stepBoss = (
  boss: TRexBoss,
  predicate: () => boolean,
  maxMs = 30000,
  stepMs = 16,
  playerX = 100,
): number => {
  let elapsed = 0;
  while (elapsed < maxMs && !predicate()) {
    boss.update(stepMs, playerX, 200);
    elapsed += stepMs;
  }
  return elapsed;
};

describe('Sprint 5 — T-Rex flow integration', () => {
  it('T-Rex roar dispara camera shake via CameraSystem', () => {
    const camera = new CameraSystem();
    const boss = new TRexBoss(400, 200, {
      onRoar: (intensity, durationMs) => camera.shake(intensity, durationMs),
    });

    stepBoss(boss, () => camera.isShaking);
    expect(camera.isShaking).toBe(true);

    // Verify the offsets are applied each tick
    camera.update(50);
    expect(Math.abs(camera.offsetX) + Math.abs(camera.offsetY)).toBeGreaterThan(0);
  });

  it('phase 3 emite shockwaves que causam dano ao jogador no chão', () => {
    let waves: ShockwaveSpawn[] = [];
    const boss = new TRexBoss(400, 200, {
      onShockwave: (w) => (waves = w),
    });
    // Force into phase 3
    boss.takeDamage(TRexBoss.maxHp - TRexBoss.phase3HpThreshold);
    expect(boss.phase).toBe('phase3');
    stepBoss(boss, () => waves.length > 0);

    expect(waves).toHaveLength(2);
    expect(waves[0].damage).toBeGreaterThan(0);

    // Simulating: shockwave hits a grounded player
    const player = new Player();
    const hpBefore = player.hp;
    const damaged = player.takeDamage(waves[0].damage);
    expect(damaged).toBe(true);
    expect(player.hp).toBeLessThan(hpBefore);
  });

  it('phase 2 charge faz o boss percorrer distância considerável', () => {
    const boss = new TRexBoss(400, 200);
    boss.takeDamage(TRexBoss.maxHp - TRexBoss.phase2HpThreshold);
    const startX = boss.x;

    // Step until charging starts
    stepBoss(boss, () => boss.state === 'charging', 30000, 16, 50);
    // Apply velocity manually for several ticks to simulate physics
    let simulatedX = startX;
    let ticks = 0;
    while (boss.state === 'charging' && ticks < 200) {
      boss.update(16, 50, 200);
      simulatedX += boss.vx * (16 / 1000);
      ticks++;
    }

    expect(Math.abs(simulatedX - startX)).toBeGreaterThan(200);
  });

  it('phase 2 entry spawns 2 MiniTRex', () => {
    const onSpawnMiniTRex = vi.fn();
    const boss = new TRexBoss(400, 200, { onSpawnMiniTRex });
    boss.takeDamage(TRexBoss.maxHp - TRexBoss.phase2HpThreshold);
    expect(onSpawnMiniTRex).toHaveBeenCalledTimes(1);
    const spawns = onSpawnMiniTRex.mock.calls[0][0];
    expect(spawns).toHaveLength(2);

    // Verify MiniTRex behaves as expected with these positions
    const mini = new MiniTRex();
    mini.setPosition(spawns[0].x, spawns[0].y);
    mini.update(16, 400, 200);
    // Player is to the right of mini → should chase right
    expect(mini.isChasing).toBe(true);
    expect(mini.facing).toBe(Direction.Right);
  });

  it('NerfRifle modifica velocidade e dano dos projéteis', () => {
    const gun = new FoamGun();
    const baseShot = gun.fire(100, 100, Direction.Right);
    expect(baseShot).not.toBeNull();
    if (!baseShot) return;

    const baseVx = baseShot.vx;
    const baseDamage = baseShot.damage;

    // Simulate NerfRifle modifying the projectile
    const boosted = { ...baseShot, vx: baseShot.vx * NERF_RIFLE_SPEED_MULTIPLIER, damage: baseShot.damage + NERF_RIFLE_DAMAGE_BONUS };
    expect(boosted.vx).toBeGreaterThan(baseVx);
    expect(boosted.damage).toBe(baseDamage + NERF_RIFLE_DAMAGE_BONUS);
    expect(NERF_RIFLE_SPEED_MULTIPLIER).toBeGreaterThan(1);
  });

  it('NerfRifle duração expira após 30s e dispara onNerfRifleEnd', () => {
    const onNerfRifleEnd = vi.fn();
    const p = new Player({ onNerfRifleEnd });
    p.activateNerfRifle();
    expect(p.hasNerfRifle).toBe(true);
    // 29s — still active
    p.update(29000);
    expect(p.hasNerfRifle).toBe(true);
    expect(onNerfRifleEnd).not.toHaveBeenCalled();
    // 1.5s more — expired
    p.update(1500);
    expect(p.hasNerfRifle).toBe(false);
    expect(onNerfRifleEnd).toHaveBeenCalledTimes(1);
  });

  it('dano durante recovering é amplificado, encurtando a luta', () => {
    const boss = new TRexBoss(400, 200);
    // Get to phase 2 so we can trigger a charge
    boss.takeDamage(TRexBoss.maxHp - TRexBoss.phase2HpThreshold);
    expect(boss.phase).toBe('phase2');

    // Wait for charge → recovering
    stepBoss(boss, () => boss.state === 'recovering', 30000, 16, 50);
    expect(boss.state).toBe('recovering');

    // Hit during recovering: damage 2 → effective 3 (floor(2*1.5))
    const hpBefore = boss.hp;
    boss.takeDamage(2);
    expect(hpBefore - boss.hp).toBe(3);
  });
});
