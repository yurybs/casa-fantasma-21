import { describe, it, expect, vi } from 'vitest';
import { ClownBoss } from '../../src/entities/enemies/ClownBoss';

describe('Confusão de tela: ativação e desativação no fluxo do ClownBoss', () => {
  it('phase1 → phase2 ativa confusão; pulse termina sozinho', () => {
    const onConfusionStart = vi.fn();
    const onConfusionEnd = vi.fn();
    const c = new ClownBoss(400, 200, { onConfusionStart, onConfusionEnd });

    expect(c.isConfusionActive).toBe(false);
    c.takeDamage(ClownBoss.maxHp - ClownBoss.phase2HpThreshold);
    expect(c.isConfusionActive).toBe(true);
    expect(onConfusionStart).toHaveBeenCalledTimes(1);
    expect(onConfusionEnd).not.toHaveBeenCalled();

    let elapsed = 0;
    while (elapsed < ClownBoss.confusionPulseMs + 50) {
      c.update(50, 200, 200);
      elapsed += 50;
    }
    expect(c.isConfusionActive).toBe(false);
    expect(onConfusionEnd).toHaveBeenCalledTimes(1);
  });

  it('boss morre durante confusão → confusão termina imediatamente', () => {
    const onConfusionEnd = vi.fn();
    const c = new ClownBoss(400, 200, { onConfusionEnd });
    c.takeDamage(ClownBoss.maxHp - ClownBoss.phase2HpThreshold);
    expect(c.isConfusionActive).toBe(true);

    c.takeDamage(ClownBoss.phase2HpThreshold);
    c.update(16, 200, 200);
    expect(c.isDead).toBe(true);
    expect(c.isConfusionActive).toBe(false);
    expect(onConfusionEnd).toHaveBeenCalledTimes(1);
  });

  it('confusão não reativa caso boss tome mais dano em phase2', () => {
    const onConfusionStart = vi.fn();
    const c = new ClownBoss(400, 200, { onConfusionStart });
    c.takeDamage(ClownBoss.maxHp - ClownBoss.phase2HpThreshold);
    let elapsed = 0;
    while (elapsed < ClownBoss.confusionPulseMs + 50) {
      c.update(50, 200, 200);
      elapsed += 50;
    }
    expect(c.isConfusionActive).toBe(false);
    c.takeDamage(1);
    expect(c.isConfusionActive).toBe(false);
    expect(onConfusionStart).toHaveBeenCalledTimes(1);
  });
});
