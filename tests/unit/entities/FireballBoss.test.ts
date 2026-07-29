import { describe, it, expect, vi } from 'vitest';
import {
  FireballBoss,
  MiniFireballSpawn,
  ExplosiveSpawn,
} from '../../../src/entities/enemies/FireballBoss';

const stepUntil = (
  boss: FireballBoss,
  predicate: () => boolean,
  maxMs = 20000,
  stepMs = 16,
  playerX = 200,
  playerY = 200,
): number => {
  let elapsed = 0;
  while (elapsed < maxMs && !predicate()) {
    boss.update(stepMs, playerX, playerY);
    elapsed += stepMs;
  }
  return elapsed;
};

describe('FireballBoss', () => {
  it('inicia em phase1 com HP máximo, drifting e tag ghost', () => {
    const b = new FireballBoss(400, 200);
    expect(b.phase).toBe('phase1');
    expect(b.state).toBe('drifting');
    expect(b.hp).toBe(FireballBoss.maxHpValue);
    expect(b.hp).toBe(22);
    expect(b.tag).toBe('ghost');
    expect(b.damage).toBe(2);
  });

  it('faz drift diagonal (vx e vy não-zero)', () => {
    const b = new FireballBoss(400, 200);
    b.update(16, 200, 200);
    expect(b.vx).not.toBe(0);
    expect(b.vy).not.toBe(0);
  });

  it('quica nos limites horizontais do box de drift', () => {
    const b = new FireballBoss(400, 200);
    // Pure logic doesn't integrate position — simulate it (like the scene does).
    let bounced = false;
    let prevVx = 0;
    for (let i = 0; i < 2000 && !bounced; i++) {
      b.update(16, 200, 200);
      b.x += b.vx * (16 / 1000);
      b.y += b.vy * (16 / 1000);
      if (prevVx !== 0 && Math.sign(b.vx) !== Math.sign(prevVx)) bounced = true;
      prevVx = b.vx;
    }
    expect(bounced).toBe(true);
  });

  it('emite onDropTrail continuamente', () => {
    const onDropTrail = vi.fn();
    const b = new FireballBoss(400, 200, { onDropTrail });
    stepUntil(b, () => onDropTrail.mock.calls.length >= 2);
    expect(onDropTrail.mock.calls.length).toBeGreaterThanOrEqual(2);
    const drop = onDropTrail.mock.calls[0][0];
    expect(typeof drop.x).toBe('number');
    expect(typeof drop.y).toBe('number');
  });

  it('lança explosivos (onLobExplosive) periodicamente', () => {
    const onLobExplosive = vi.fn();
    const b = new FireballBoss(400, 200, { onLobExplosive });
    stepUntil(b, () => onLobExplosive.mock.calls.length > 0);
    expect(onLobExplosive).toHaveBeenCalled();
    const spawn: ExplosiveSpawn = onLobExplosive.mock.calls[0][0];
    expect(spawn.vy).toBeLessThan(0); // arcs upward first
  });

  it('transição phase1→phase2 em HP ≤ 11 e spawna 2 mini fireballs', () => {
    const onPhaseChange = vi.fn();
    const onSpawnMiniFireballs = vi.fn();
    const b = new FireballBoss(400, 200, { onPhaseChange, onSpawnMiniFireballs });
    b.takeDamage(FireballBoss.maxHpValue - FireballBoss.phase2HpThreshold);
    expect(b.phase).toBe('phase2');
    expect(onPhaseChange).toHaveBeenCalledWith('phase2');
    expect(onSpawnMiniFireballs).toHaveBeenCalledTimes(1);
    const spawns: MiniFireballSpawn[] = onSpawnMiniFireballs.mock.calls[0][0];
    expect(spawns).toHaveLength(2);
  });

  it('spawn de minis ocorre apenas uma vez', () => {
    const onSpawnMiniFireballs = vi.fn();
    const b = new FireballBoss(400, 200, { onSpawnMiniFireballs });
    b.takeDamage(FireballBoss.maxHpValue - FireballBoss.phase2HpThreshold);
    b.takeDamage(1);
    expect(onSpawnMiniFireballs).toHaveBeenCalledTimes(1);
  });

  it('phase 2 executa dash em direção ao jogador', () => {
    const onDashStart = vi.fn();
    const b = new FireballBoss(400, 200, { onDashStart });
    b.takeDamage(FireballBoss.maxHpValue - FireballBoss.phase2HpThreshold);
    // Player far to the left → dash should carry the boss left
    stepUntil(b, () => b.state === 'dashing', 20000, 16, 50, 200);
    expect(b.state).toBe('dashing');
    expect(onDashStart).toHaveBeenCalled();
    // During dash, speed is high
    const speed = Math.hypot(b.vx, b.vy);
    expect(speed).toBeGreaterThan(200);
  });

  it('após dash volta ao estado drifting', () => {
    const b = new FireballBoss(400, 200);
    b.takeDamage(FireballBoss.maxHpValue - FireballBoss.phase2HpThreshold);
    stepUntil(b, () => b.state === 'dashing', 20000, 16, 50, 200);
    stepUntil(b, () => b.state === 'drifting', 20000, 16, 50, 200);
    expect(b.state).toBe('drifting');
  });

  it('morto zera velocidades', () => {
    const b = new FireballBoss(400, 200);
    b.takeDamage(FireballBoss.maxHpValue);
    expect(b.isDead).toBe(true);
    b.update(16, 200, 200);
    expect(b.vx).toBe(0);
    expect(b.vy).toBe(0);
  });
});
