import { describe, it, expect } from 'vitest';
import { PhysicsSystem } from '../../../src/systems/PhysicsSystem';
import { PHYSICS } from '../../../src/types/GameTypes';

describe('PhysicsSystem', () => {
  it('aplica gravidade a corpo no ar', () => {
    const body = { vx: 0, vy: 0, isOnGround: false };
    PhysicsSystem.applyGravity(body, 1000);
    expect(body.vy).toBeGreaterThan(0);
  });

  it('não aplica gravidade quando no chão', () => {
    const body = { vx: 0, vy: 0, isOnGround: true };
    PhysicsSystem.applyGravity(body, 1000);
    expect(body.vy).toBe(0);
  });

  it('respeita terminal velocity', () => {
    const body = { vx: 0, vy: PHYSICS.terminalVelocity - 1, isOnGround: false };
    PhysicsSystem.applyGravity(body, 5000);
    expect(body.vy).toBeLessThanOrEqual(PHYSICS.terminalVelocity);
  });

  it('clampToTerminalVelocity prende vy ao limite', () => {
    const body = { vx: 0, vy: 9999, isOnGround: false };
    PhysicsSystem.clampToTerminalVelocity(body);
    expect(body.vy).toBe(PHYSICS.terminalVelocity);
  });

  it('gravity acumula proporcionalmente ao delta', () => {
    const body = { vx: 0, vy: 0, isOnGround: false };
    PhysicsSystem.applyGravity(body, 100);
    const after100 = body.vy;
    const body2 = { vx: 0, vy: 0, isOnGround: false };
    PhysicsSystem.applyGravity(body2, 200);
    expect(body2.vy).toBeCloseTo(after100 * 2, 5);
  });
});
