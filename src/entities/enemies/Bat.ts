import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const BAT_CONFIG = {
  hp: 1,
  damage: 1,
  speed: 130,
};

const HOMING_ACCEL = 260; // px/s² steering toward the player
const WOBBLE_AMPLITUDE = 30;
const WOBBLE_FREQ = 0.008;

/**
 * Bat: homing flyer launched by the VampireBoss (also placeable in levels).
 * Steers continuously toward the player with capped speed and a sinusoidal
 * vertical wobble, so it can be dodged with well-timed jumps. Tagged
 * 'normal' — dies to a single hit of any weapon.
 */
export class Bat extends BaseEnemy {
  readonly tag: 'normal' = 'normal';

  private timeMs: number = 0;

  constructor(events: EnemyEvents = {}) {
    super(BAT_CONFIG, events);
  }

  update(deltaMs: number, playerX: number, playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      return;
    }
    this.timeMs += deltaMs;
    const dt = deltaMs / 1000;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    this.vx += (dx / dist) * HOMING_ACCEL * dt;
    this.vy += (dy / dist) * HOMING_ACCEL * dt;

    // Cap total speed so the bat stays dodgeable.
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.speed) {
      this.vx = (this.vx / speed) * this.speed;
      this.vy = (this.vy / speed) * this.speed;
    }

    // Vertical wobble on top of the homing path.
    this.vy += Math.sin(this.timeMs * WOBBLE_FREQ) * WOBBLE_AMPLITUDE * dt * 10;

    this.facing = dx < 0 ? Direction.Left : Direction.Right;
  }

  static get homingAccel(): number {
    return HOMING_ACCEL;
  }

  static get maxSpeed(): number {
    return BAT_CONFIG.speed;
  }
}
