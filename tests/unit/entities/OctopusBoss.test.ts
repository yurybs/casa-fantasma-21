import { describe, it, expect, vi } from 'vitest';
import {
  OctopusBoss,
  MiniOctopusSpawn,
  TentacleStrikeInfo,
} from '../../../src/entities/enemies/OctopusBoss';

const stepUntil = (
  boss: OctopusBoss,
  predicate: () => boolean,
  maxMs = 20000,
  stepMs = 16,
  playerX = 200,
): number => {
  let elapsed = 0;
  while (elapsed < maxMs && !predicate()) {
    boss.update(stepMs, playerX, 200);
    elapsed += stepMs;
  }
  return elapsed;
};

describe('OctopusBoss', () => {
  it('inicia em phase1 com HP máximo, 4 tentáculos e idle', () => {
    const b = new OctopusBoss(400, 200);
    expect(b.phase).toBe('phase1');
    expect(b.state).toBe('idle');
    expect(b.hp).toBe(OctopusBoss.maxHpValue);
    expect(b.hp).toBe(24);
    expect(b.tentacleCount).toBe(4);
    expect(b.tag).toBe('normal');
  });

  it('permanece ancorado (não se move)', () => {
    const b = new OctopusBoss(400, 200);
    b.update(16, 100, 100);
    expect(b.x).toBe(400);
    expect(b.y).toBe(200);
    expect(b.vx).toBe(0);
    expect(b.vy).toBe(0);
  });

  it('golpeia com tentáculos (onTentacleStrike) em sequência', () => {
    const onTentacleStrike = vi.fn();
    const b = new OctopusBoss(400, 200, { onTentacleStrike });
    stepUntil(b, () => onTentacleStrike.mock.calls.length > 0);
    expect(onTentacleStrike).toHaveBeenCalled();
    const info: TentacleStrikeInfo = onTentacleStrike.mock.calls[0][0];
    expect(info.index).toBeGreaterThanOrEqual(0);
    expect(info.reach).toBe(OctopusBoss.tentacleReach);
  });

  it('índices de tentáculo variam entre golpes (sequência rotativa)', () => {
    const strikes: number[] = [];
    const b = new OctopusBoss(400, 200, {
      onTentacleStrike: (info) => strikes.push(info.index),
    });
    stepUntil(b, () => strikes.length >= 2, 30000);
    expect(strikes.length).toBeGreaterThanOrEqual(2);
    expect(strikes[0]).not.toBe(strikes[1]);
  });

  it('emite onInkSplash com a duração do escurecimento', () => {
    const onInkSplash = vi.fn();
    const b = new OctopusBoss(400, 200, { onInkSplash });
    stepUntil(b, () => onInkSplash.mock.calls.length > 0, 30000);
    expect(onInkSplash).toHaveBeenCalled();
    expect(onInkSplash.mock.calls[0][0]).toBe(OctopusBoss.inkDurationMs);
  });

  it('transição phase1→phase2 em HP ≤ 12: cresce para 6 tentáculos + spawna minis', () => {
    const onPhaseChange = vi.fn();
    const onSpawnMiniOctopus = vi.fn();
    const b = new OctopusBoss(400, 200, { onPhaseChange, onSpawnMiniOctopus });
    b.takeDamage(OctopusBoss.maxHpValue - OctopusBoss.phase2HpThreshold);
    expect(b.phase).toBe('phase2');
    expect(b.tentacleCount).toBe(6);
    expect(onPhaseChange).toHaveBeenCalledWith('phase2');
    expect(onSpawnMiniOctopus).toHaveBeenCalledTimes(1);
    const spawns: MiniOctopusSpawn[] = onSpawnMiniOctopus.mock.calls[0][0];
    expect(spawns).toHaveLength(2);
  });

  it('spawn de minis ocorre apenas uma vez', () => {
    const onSpawnMiniOctopus = vi.fn();
    const b = new OctopusBoss(400, 200, { onSpawnMiniOctopus });
    b.takeDamage(OctopusBoss.maxHpValue - OctopusBoss.phase2HpThreshold);
    b.takeDamage(1);
    expect(onSpawnMiniOctopus).toHaveBeenCalledTimes(1);
  });

  it('phase 2 golpeia mais rápido que phase 1', () => {
    const p1 = new OctopusBoss(400, 200, { onTentacleStrike: () => {} });
    const t1 = stepUntil(p1, () => p1.state === 'striking', 30000);

    const p2 = new OctopusBoss(400, 200, { onTentacleStrike: () => {} });
    p2.takeDamage(OctopusBoss.maxHpValue - OctopusBoss.phase2HpThreshold);
    const t2 = stepUntil(p2, () => p2.state === 'striking', 30000);

    expect(t2).toBeLessThan(t1);
  });

  it('morto zera velocidade e activeTentacle', () => {
    const b = new OctopusBoss(400, 200);
    b.takeDamage(OctopusBoss.maxHpValue);
    expect(b.isDead).toBe(true);
    b.update(16, 200, 200);
    expect(b.vx).toBe(0);
    expect(b.activeTentacle).toBe(-1);
  });
});
