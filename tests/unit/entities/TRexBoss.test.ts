import { describe, it, expect, vi } from 'vitest';
import { TRexBoss, ShockwaveSpawn, MiniTRexSpawn } from '../../../src/entities/enemies/TRexBoss';
import { Direction } from '../../../src/types/GameTypes';

const stepUntil = (
  boss: TRexBoss,
  predicate: () => boolean,
  maxMs = 30000,
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

describe('TRexBoss', () => {
  it('inicia em phase1 com HP máximo, walking e tag normal', () => {
    const b = new TRexBoss(400, 200);
    expect(b.phase).toBe('phase1');
    expect(b.state).toBe('walking');
    expect(b.hp).toBe(TRexBoss.maxHp);
    expect(b.tag).toBe('normal');
    expect(b.damage).toBe(2);
  });

  it('patrulha movendo vx em phase 1', () => {
    const b = new TRexBoss(400, 200);
    b.update(16, 200, 200);
    expect(b.vx).not.toBe(0);
  });

  it('emite onRoar periodicamente, com camera shake', () => {
    const onRoar = vi.fn();
    const b = new TRexBoss(400, 200, { onRoar });
    stepUntil(b, () => onRoar.mock.calls.length > 0);
    expect(onRoar).toHaveBeenCalled();
    const [intensity, duration] = onRoar.mock.calls[0];
    expect(intensity).toBeGreaterThan(0);
    expect(duration).toBeGreaterThan(0);
  });

  it('roar pausa o movimento (state = roaring, vx=0)', () => {
    const b = new TRexBoss(400, 200);
    stepUntil(b, () => b.state === 'roaring');
    expect(b.state).toBe('roaring');
    expect(b.vx).toBe(0);
  });

  it('transição phase1→phase2 ocorre em HP <= 12', () => {
    const onPhaseChange = vi.fn();
    const onSpawnMiniTRex = vi.fn();
    const b = new TRexBoss(400, 200, { onPhaseChange, onSpawnMiniTRex });
    b.takeDamage(TRexBoss.maxHp - TRexBoss.phase2HpThreshold);
    expect(b.phase).toBe('phase2');
    expect(onPhaseChange).toHaveBeenCalledWith('phase2');
    expect(onSpawnMiniTRex).toHaveBeenCalled();
    const spawns: MiniTRexSpawn[] = onSpawnMiniTRex.mock.calls[0][0];
    expect(spawns).toHaveLength(2);
  });

  it('transição phase2→phase3 ocorre em HP <= 6', () => {
    const onPhaseChange = vi.fn();
    const b = new TRexBoss(400, 200, { onPhaseChange });
    b.takeDamage(TRexBoss.maxHp - TRexBoss.phase2HpThreshold);
    onPhaseChange.mockClear();
    b.takeDamage(TRexBoss.phase2HpThreshold - TRexBoss.phase3HpThreshold);
    expect(b.phase).toBe('phase3');
    expect(onPhaseChange).toHaveBeenCalledWith('phase3');
  });

  it('phase 2 carrega na direção do jogador', () => {
    const onChargeStart = vi.fn();
    const b = new TRexBoss(400, 200, { onChargeStart });
    // Force enter phase 2
    b.takeDamage(TRexBoss.maxHp - TRexBoss.phase2HpThreshold);
    // Player to the LEFT
    stepUntil(b, () => b.state === 'charging', 30000, 16, 50);
    expect(b.state).toBe('charging');
    expect(onChargeStart).toHaveBeenCalled();
    expect(onChargeStart.mock.calls[0][0]).toBe(Direction.Left);
    expect(b.vx).toBeLessThan(0);
    expect(Math.abs(b.vx)).toBe(TRexBoss.chargeSpeed);
  });

  it('após charge entra em recovering com vx=0', () => {
    const b = new TRexBoss(400, 200);
    b.takeDamage(TRexBoss.maxHp - TRexBoss.phase2HpThreshold);
    stepUntil(b, () => b.state === 'charging', 30000, 16, 50);
    stepUntil(b, () => b.state === 'recovering', 30000, 16, 50);
    expect(b.state).toBe('recovering');
    expect(b.vx).toBe(0);
  });

  it('dano em recovering é amplificado em 50%', () => {
    const b = new TRexBoss(400, 200);
    b.takeDamage(TRexBoss.maxHp - TRexBoss.phase2HpThreshold);
    stepUntil(b, () => b.state === 'recovering', 30000, 16, 50);
    const hpBefore = b.hp;
    b.takeDamage(2);
    // dano efetivo deve ser floor(2 * 1.5) = 3
    expect(hpBefore - b.hp).toBe(3);
  });

  it('phase 3 emite shockwave após o rugido', () => {
    const onShockwave = vi.fn();
    const b = new TRexBoss(400, 200, { onShockwave });
    b.takeDamage(TRexBoss.maxHp - TRexBoss.phase3HpThreshold);
    expect(b.phase).toBe('phase3');
    stepUntil(b, () => onShockwave.mock.calls.length > 0);
    const waves: ShockwaveSpawn[] = onShockwave.mock.calls[0][0];
    expect(waves).toHaveLength(2);
    expect(waves[0].direction).toBe(Direction.Left);
    expect(waves[1].direction).toBe(Direction.Right);
    expect(waves[0].speed).toBe(TRexBoss.shockwaveSpeed);
    expect(waves[0].ttlMs).toBe(TRexBoss.shockwaveTtlMs);
    expect(waves[0].damage).toBeGreaterThan(0);
  });

  it('phase 3 roar tem intensidade de shake maior que phase 1', () => {
    const onRoarP1 = vi.fn();
    const onRoarP3 = vi.fn();
    const b1 = new TRexBoss(400, 200, { onRoar: onRoarP1 });
    stepUntil(b1, () => onRoarP1.mock.calls.length > 0);
    const intensityP1 = onRoarP1.mock.calls[0][0];

    const b3 = new TRexBoss(400, 200, { onRoar: onRoarP3 });
    b3.takeDamage(TRexBoss.maxHp - TRexBoss.phase3HpThreshold);
    stepUntil(b3, () => onRoarP3.mock.calls.length > 0);
    const intensityP3 = onRoarP3.mock.calls[0][0];

    expect(intensityP3).toBeGreaterThan(intensityP1);
  });

  it('morto zera velocidades e não atualiza', () => {
    const b = new TRexBoss(400, 200);
    b.takeDamage(TRexBoss.maxHp);
    expect(b.isDead).toBe(true);
    b.update(16, 200, 200);
    expect(b.vx).toBe(0);
    expect(b.vy).toBe(0);
  });

  it('isInvulnerable bloqueia dano completamente', () => {
    const b = new TRexBoss(400, 200);
    b.isInvulnerable = true;
    const hpBefore = b.hp;
    b.takeDamage(5);
    expect(b.hp).toBe(hpBefore);
  });

  it('mini T-Rex spawn ocorre uma única vez na entrada da fase 2', () => {
    const onSpawnMiniTRex = vi.fn();
    const b = new TRexBoss(400, 200, { onSpawnMiniTRex });
    b.takeDamage(TRexBoss.maxHp - TRexBoss.phase2HpThreshold);
    expect(onSpawnMiniTRex).toHaveBeenCalledTimes(1);
    // Mais dano (entrando em phase 3) NÃO deve spawnar mais
    b.takeDamage(TRexBoss.phase2HpThreshold - TRexBoss.phase3HpThreshold);
    expect(onSpawnMiniTRex).toHaveBeenCalledTimes(1);
  });
});
