import { describe, it, expect, vi } from 'vitest';
import { FireballBoss, MiniFireballSpawn } from '../../src/entities/enemies/FireballBoss';
import { OctopusBoss } from '../../src/entities/enemies/OctopusBoss';
import { MiniFireball } from '../../src/entities/enemies/MiniFireball';
import { MiniOctopus } from '../../src/entities/enemies/MiniOctopus';
import { Player } from '../../src/entities/Player';
import { WaterGun } from '../../src/weapons/WaterGun';
import { Direction } from '../../src/types/GameTypes';

const stepBoss = <T extends { update: (d: number, px: number, py: number) => void }>(
  boss: T,
  predicate: () => boolean,
  maxMs = 20000,
  stepMs = 16,
  px = 200,
  py = 200,
): number => {
  let elapsed = 0;
  while (elapsed < maxMs && !predicate()) {
    boss.update(stepMs, px, py);
    elapsed += stepMs;
  }
  return elapsed;
};

describe('Sprint 7 — Castelo (Bola de Fogo + Polvo) integração', () => {
  it('FireballBoss deixa rastro de fogo continuamente e o rastro dano cabe no Player', () => {
    const drops: { x: number; y: number }[] = [];
    const boss = new FireballBoss(400, 200, { onDropTrail: (d) => drops.push(d) });
    stepBoss(boss, () => drops.length >= 3);
    expect(drops.length).toBeGreaterThanOrEqual(3);

    // Trail damage is applied by the scene as 1 point of contact damage.
    const p = new Player();
    const before = p.hp;
    expect(p.takeDamage(1)).toBe(true);
    expect(p.hp).toBe(before - 1);
  });

  it('FireballBoss se divide em 2 mini fireballs na fase 2', () => {
    const onSpawnMiniFireballs = vi.fn();
    const boss = new FireballBoss(400, 200, { onSpawnMiniFireballs });
    boss.takeDamage(FireballBoss.maxHpValue - FireballBoss.phase2HpThreshold);
    expect(boss.phase).toBe('phase2');
    const spawns: MiniFireballSpawn[] = onSpawnMiniFireballs.mock.calls[0][0];
    expect(spawns).toHaveLength(2);

    // The spawned minis behave as homing flames (player within detection range).
    const mini = new MiniFireball();
    mini.setPosition(spawns[0].x, spawns[0].y);
    mini.update(16, spawns[0].x + 120, spawns[0].y);
    expect(mini.isChasing).toBe(true);
  });

  it('FireballBoss tem HP maior (22) do que os chefes de fases anteriores', () => {
    expect(FireballBoss.maxHpValue).toBe(22);
  });

  it('água causa 2x de dano na Bola de Fogo (tag ghost)', () => {
    const boss = new FireballBoss(400, 200);
    const w = new WaterGun();
    const p = w.fire(0, 0, Direction.Right);
    expect(p).not.toBeNull();
    if (!p) return;
    const dmg = WaterGun.damageFor(p, boss.tag);
    expect(dmg).toBe(2); // foam(1) * 2 vs ghost
  });

  it('OctopusBoss escurece a tela (onInkSplash) e cresce para 6 tentáculos na fase 2', () => {
    const onInkSplash = vi.fn();
    const onSpawnMiniOctopus = vi.fn();
    const boss = new OctopusBoss(400, 200, { onInkSplash, onSpawnMiniOctopus });
    expect(boss.tentacleCount).toBe(4);

    stepBoss(boss, () => onInkSplash.mock.calls.length > 0, 30000);
    expect(onInkSplash).toHaveBeenCalled();
    expect(onInkSplash.mock.calls[0][0]).toBe(OctopusBoss.inkDurationMs);

    boss.takeDamage(OctopusBoss.maxHpValue - OctopusBoss.phase2HpThreshold);
    expect(boss.tentacleCount).toBe(6);
    expect(onSpawnMiniOctopus).toHaveBeenCalledTimes(1);
  });

  it('OctopusBoss tem HP maior (24) e mini octopus é rasteiro perseguidor', () => {
    expect(OctopusBoss.maxHpValue).toBe(24);
    const mini = new MiniOctopus();
    mini.setPosition(200, 200);
    mini.update(16, 260, 200);
    expect(mini.isChasing).toBe(true);
    expect(mini.facing).toBe(Direction.Right);
  });

  it('tentáculos golpeiam em ângulos diferentes (rotação sequencial)', () => {
    const angles: number[] = [];
    const boss = new OctopusBoss(400, 200, {
      onTentacleStrike: (info) => angles.push(info.angle),
    });
    stepBoss(boss, () => angles.length >= 2, 30000);
    expect(angles.length).toBeGreaterThanOrEqual(2);
    expect(angles[0]).not.toBe(angles[1]);
  });
});
