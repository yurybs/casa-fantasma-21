import { describe, it, expect } from 'vitest';
import { SpiderGhost } from '../../../src/entities/enemies/SpiderGhost';

const stepUntil = (
  s: SpiderGhost,
  predicate: () => boolean,
  playerX: number,
  playerY: number,
  maxMs = 6000,
  stepMs = 16,
): { elapsed: number; reached: boolean } => {
  let elapsed = 0;
  while (elapsed < maxMs) {
    if (predicate()) return { elapsed, reached: true };
    s.update(stepMs, playerX, playerY);
    s.y += (s.vy * stepMs) / 1000;
    elapsed += stepMs;
  }
  return { elapsed, reached: predicate() };
};

describe('SpiderGhost', () => {
  it('inicia com 2 HP e tag ghost', () => {
    const s = new SpiderGhost(80);
    expect(s.hp).toBe(2);
    expect(s.tag).toBe('ghost');
  });

  it('inicia em estado idle', () => {
    const s = new SpiderGhost(80);
    expect(s.state).toBe('idle');
  });

  it('detecta jogador próximo e desce', () => {
    const s = new SpiderGhost(80, 160);
    s.setPosition(200, 80);
    s.update(16, 220, 360); // jogador horizontal próximo
    expect(s.state).toBe('descending');
  });

  it('não desce quando jogador está fora do range horizontal', () => {
    const s = new SpiderGhost(80);
    s.setPosition(200, 80);
    s.update(16, 600, 360);
    expect(s.state).toBe('idle');
  });

  it('descida tem vy positivo', () => {
    const s = new SpiderGhost(80, 160);
    s.setPosition(200, 80);
    s.update(16, 200, 360);
    expect(s.vy).toBeGreaterThan(0);
  });

  it('completa ciclo: descending → holding → ascending → cooldown → idle', () => {
    const s = new SpiderGhost(80, 160);
    s.setPosition(200, 80);
    stepUntil(s, () => s.state === 'descending', 200, 360);
    stepUntil(s, () => s.state === 'holding', 200, 360);
    expect(s.state).toBe('holding');
    stepUntil(s, () => s.state === 'ascending', 200, 360);
    expect(s.state).toBe('ascending');
    stepUntil(s, () => s.state === 'cooldown', 200, 360);
    expect(s.state).toBe('cooldown');
    stepUntil(s, () => s.state === 'idle', 200, 360);
    expect(s.state).toBe('idle');
  });

  it('morre com 2 de dano', () => {
    const s = new SpiderGhost(80);
    s.takeDamage(2);
    expect(s.isDead).toBe(true);
  });

  it('morto zera velocidade', () => {
    const s = new SpiderGhost(80);
    s.takeDamage(99);
    s.update(16, 100, 100);
    expect(s.vx).toBe(0);
    expect(s.vy).toBe(0);
  });
});
