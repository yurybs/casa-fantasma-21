import { describe, it, expect, vi } from 'vitest';
import { ScarecrowBoss } from '../../../src/entities/enemies/ScarecrowBoss';

const stepUntil = (
  boss: ScarecrowBoss,
  predicate: () => boolean,
  playerX: number = 200,
  maxMs = 12000,
  stepMs = 16,
): number => {
  let elapsed = 0;
  while (elapsed < maxMs && !predicate()) {
    boss.update(stepMs, playerX, 200);
    elapsed += stepMs;
  }
  return elapsed;
};

describe('ScarecrowBoss', () => {
  it('inicia em phase1 com HP máximo e estado idle', () => {
    const s = new ScarecrowBoss(400, 200);
    expect(s.phase).toBe('phase1');
    expect(s.hp).toBe(ScarecrowBoss.maxHp);
    expect(s.state).toBe('idle');
    expect(s.tag).toBe('normal');
  });

  it('a 40% HP entra em phase2 e dispara onPhaseChange', () => {
    const onPhaseChange = vi.fn();
    const s = new ScarecrowBoss(400, 200, { onPhaseChange });
    s.takeDamage(ScarecrowBoss.maxHp - ScarecrowBoss.phase2HpThreshold);
    expect(s.phase).toBe('phase2');
    expect(onPhaseChange).toHaveBeenCalledWith('phase2');
  });

  it('arm reach é 3 tiles (48px)', () => {
    expect(ScarecrowBoss.armReachTiles).toBe(3);
    expect(ScarecrowBoss.armReachPx).toBe(48);
  });

  it('estende braço periodicamente — armExtension cresce de 0 a 1', () => {
    const onArmStrike = vi.fn();
    const s = new ScarecrowBoss(400, 200, { onArmStrike });
    stepUntil(s, () => s.state === 'extending');
    expect(s.state).toBe('extending');
    stepUntil(s, () => s.armExtension >= 1, 200, 1500);
    expect(s.armExtension).toBe(1);
    expect(onArmStrike).toHaveBeenCalled();
  });

  it('getArmHitboxLength é 0 em idle e até armReachPx em extending', () => {
    const s = new ScarecrowBoss(400, 200);
    expect(s.getArmHitboxLength()).toBe(0);
    stepUntil(s, () => s.armExtension >= 1, 200, 5000);
    expect(s.getArmHitboxLength()).toBe(ScarecrowBoss.armReachPx);
  });

  it('invoca corvos via onSpawnCrows', () => {
    const onSpawnCrows = vi.fn();
    const s = new ScarecrowBoss(400, 200, { onSpawnCrows });
    stepUntil(s, () => onSpawnCrows.mock.calls.length > 0, 200, 7000);
    expect(onSpawnCrows).toHaveBeenCalled();
    expect(onSpawnCrows.mock.calls[0][0].length).toBeGreaterThan(0);
  });

  it('phase2 faz boss girar (isRotating ativa) periodicamente', () => {
    const onRotateStart = vi.fn();
    const s = new ScarecrowBoss(400, 200, { onRotateStart });
    s.takeDamage(ScarecrowBoss.maxHp - ScarecrowBoss.phase2HpThreshold);
    stepUntil(s, () => s.isRotating, 200, 12000);
    expect(s.isRotating).toBe(true);
    expect(onRotateStart).toHaveBeenCalled();
  });

  it('boss permanece estático na posição âncora', () => {
    const s = new ScarecrowBoss(400, 200);
    s.update(16, 200, 200);
    expect(s.x).toBe(400);
    expect(s.y).toBe(200);
    expect(s.vx).toBe(0);
    expect(s.vy).toBe(0);
  });

  it('isInvulnerable bloqueia dano', () => {
    const s = new ScarecrowBoss(400, 200);
    s.isInvulnerable = true;
    s.takeDamage(5);
    expect(s.hp).toBe(ScarecrowBoss.maxHp);
  });

  it('morto zera armExtension e isRotating', () => {
    const s = new ScarecrowBoss(400, 200);
    s.takeDamage(ScarecrowBoss.maxHp);
    s.update(16, 200, 200);
    expect(s.isDead).toBe(true);
    expect(s.armExtension).toBe(0);
    expect(s.isRotating).toBe(false);
  });
});
