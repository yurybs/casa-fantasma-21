import { PHYSICS } from '../types/GameTypes';

export interface PhysicsBody {
  vx: number;
  vy: number;
  isOnGround: boolean;
}

export const PhysicsSystem = {
  applyGravity(body: PhysicsBody, deltaMs: number): void {
    if (body.isOnGround) return;
    const dt = deltaMs / 1000;
    body.vy += PHYSICS.gravity * dt;
    if (body.vy > PHYSICS.terminalVelocity) {
      body.vy = PHYSICS.terminalVelocity;
    }
  },

  clampToTerminalVelocity(body: PhysicsBody): void {
    if (body.vy > PHYSICS.terminalVelocity) {
      body.vy = PHYSICS.terminalVelocity;
    }
  },
};
