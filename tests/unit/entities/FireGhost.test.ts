import { describe, it, expect, vi } from 'vitest';
import { FireGhost } from '../../../src/entities/enemies/FireGhost';
import { Direction } from '../../../src/types/GameTypes';

describe('FireGhost', () => {
  it('inicia com 2 HP, tag ghost e patrulha para a esquerda', () => {
    const f = new FireGhost(200, 100);
    expect(f.hp).toBe(2);
    expect(f.tag).toBe('ghost');
    expect(f.facing).toBe(Direction.Left);
  });

  it('vx é negativo quando facing left', () => {
    const f = new FireGhost(200, 100);
    f.update(16, 200, 200);
    expect(f.vx).toBeLessThan(0);
  });

  it('inverte direção ao atingir limite esquerdo do patrol', () => {
    const f = new FireGhost(200, 100);
    f.x = 200 - FireGhost.patrolRange - 1;
    f.update(16, 200, 200);
    expect(f.facing).toBe(Direction.Right);
    expect(f.vx).toBeGreaterThan(0);
  });

  it('inverte direção ao atingir limite direito do patrol', () => {
    const f = new FireGhost(200, 100);
    f.x = 200 + FireGhost.patrolRange + 1;
    f.update(16, 200, 200);
    expect(f.facing).toBe(Direction.Left);
    expect(f.vx).toBeLessThan(0);
  });

  it('emite onDropTrail no intervalo configurado', () => {
    const onDropTrail = vi.fn();
    const f = new FireGhost(200, 100, { onDropTrail });
    f.update(FireGhost.trailIntervalMs + 10, 200, 200);
    expect(onDropTrail).toHaveBeenCalledTimes(1);
    const drop = onDropTrail.mock.calls[0][0];
    expect(drop.x).toBe(f.x);
    expect(drop.y).toBeGreaterThan(f.y);
  });

  it('múltiplos drops após múltiplos intervalos', () => {
    const onDropTrail = vi.fn();
    const f = new FireGhost(200, 100, { onDropTrail });
    for (let i = 0; i < 5; i++) f.update(FireGhost.trailIntervalMs + 5, 200, 200);
    expect(onDropTrail.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it('morto zera velocidade e não dropa trail', () => {
    const onDropTrail = vi.fn();
    const f = new FireGhost(200, 100, { onDropTrail });
    f.takeDamage(99);
    onDropTrail.mockClear();
    f.update(FireGhost.trailIntervalMs + 10, 200, 200);
    expect(f.vx).toBe(0);
    expect(f.vy).toBe(0);
    expect(onDropTrail).not.toHaveBeenCalled();
  });

  it('morre com 2 de dano (HP=2)', () => {
    const f = new FireGhost(200, 100);
    f.takeDamage(2);
    expect(f.isDead).toBe(true);
  });
});
