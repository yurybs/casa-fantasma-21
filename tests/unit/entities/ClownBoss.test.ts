import { describe, it, expect, vi } from 'vitest';
import { ClownBoss } from '../../../src/entities/enemies/ClownBoss';

const stepUntil = (
  boss: ClownBoss,
  predicate: () => boolean,
  maxMs = 12000,
  stepMs = 16,
): number => {
  let elapsed = 0;
  while (elapsed < maxMs && !predicate()) {
    boss.update(stepMs, 200, 200);
    elapsed += stepMs;
  }
  return elapsed;
};

describe('ClownBoss', () => {
  it('inicia em phase1 com HP máximo e estado patrol', () => {
    const c = new ClownBoss(400, 200);
    expect(c.phase).toBe('phase1');
    expect(c.hp).toBe(ClownBoss.maxHp);
    expect(c.state).toBe('patrol');
    expect(c.tag).toBe('normal');
  });

  it('patrulha entre limites horizontais', () => {
    const c = new ClownBoss(400, 200);
    c.update(16, 200, 200);
    expect(c.vx).not.toBe(0);
  });

  it('lança 3 bolas após o cooldown de throw (phase1)', () => {
    const onJuggleThrow = vi.fn();
    const c = new ClownBoss(400, 200, { onJuggleThrow });
    stepUntil(c, () => onJuggleThrow.mock.calls.length > 0, 5000);
    expect(onJuggleThrow).toHaveBeenCalled();
    const balls = onJuggleThrow.mock.calls[0][0];
    expect(balls).toHaveLength(3);
    expect(balls.every((b: { vy: number }) => b.vy < 0)).toBe(true);
  });

  it('a 50% HP entra em phase2 e dispara onPhaseChange + spawn de mini-clowns + onConfusionStart', () => {
    const onPhaseChange = vi.fn();
    const onSpawnMiniClowns = vi.fn();
    const onConfusionStart = vi.fn();
    const c = new ClownBoss(400, 200, {
      onPhaseChange,
      onSpawnMiniClowns,
      onConfusionStart,
    });
    c.takeDamage(ClownBoss.maxHp - ClownBoss.phase2HpThreshold);
    expect(c.phase).toBe('phase2');
    expect(onPhaseChange).toHaveBeenCalledWith('phase2');
    expect(onSpawnMiniClowns).toHaveBeenCalledTimes(1);
    expect(onConfusionStart).toHaveBeenCalled();
    expect(onSpawnMiniClowns.mock.calls[0][0]).toHaveLength(2);
  });

  it('phase2 não duplica spawn de mini-clowns', () => {
    const onSpawnMiniClowns = vi.fn();
    const c = new ClownBoss(400, 200, { onSpawnMiniClowns });
    c.takeDamage(ClownBoss.maxHp - ClownBoss.phase2HpThreshold);
    c.takeDamage(1);
    expect(onSpawnMiniClowns).toHaveBeenCalledTimes(1);
  });

  it('confusão termina automaticamente após confusionPulseMs', () => {
    const onConfusionEnd = vi.fn();
    const c = new ClownBoss(400, 200, { onConfusionEnd });
    c.takeDamage(ClownBoss.maxHp - ClownBoss.phase2HpThreshold);
    expect(c.isConfusionActive).toBe(true);
    stepUntil(c, () => !c.isConfusionActive, ClownBoss.confusionPulseMs + 200);
    expect(c.isConfusionActive).toBe(false);
    expect(onConfusionEnd).toHaveBeenCalled();
  });

  it('morre quando HP chega a 0 e desativa a confusão', () => {
    const onConfusionEnd = vi.fn();
    const c = new ClownBoss(400, 200, { onConfusionEnd });
    c.takeDamage(ClownBoss.maxHp - ClownBoss.phase2HpThreshold);
    c.takeDamage(ClownBoss.phase2HpThreshold);
    expect(c.isDead).toBe(true);
    c.update(16, 200, 200);
    expect(c.isConfusionActive).toBe(false);
    expect(onConfusionEnd).toHaveBeenCalled();
  });

  it('phase2 patrol speed é maior que phase1 (mesmo passo de update)', () => {
    const c1 = new ClownBoss(400, 200);
    c1.update(16, 200, 200);
    expect(c1.state).toBe('patrol');
    const speed1 = Math.abs(c1.vx);

    const c2 = new ClownBoss(400, 200);
    c2.takeDamage(ClownBoss.maxHp - ClownBoss.phase2HpThreshold);
    // Step until patrol is reached and timers stabilize.
    let safety = 0;
    while (c2.state !== 'patrol' && safety < 500) {
      c2.update(16, 200, 200);
      safety += 1;
    }
    c2.update(16, 200, 200);
    const speed2 = Math.abs(c2.vx);
    expect(speed2).toBeGreaterThan(speed1);
  });

  it('isInvulnerable bloqueia dano', () => {
    const c = new ClownBoss(400, 200);
    c.isInvulnerable = true;
    c.takeDamage(5);
    expect(c.hp).toBe(ClownBoss.maxHp);
  });
});
