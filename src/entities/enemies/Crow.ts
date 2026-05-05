import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const CROW_CONFIG = {
  hp: 1,
  damage: 1,
  speed: 130,
};

const SINE_AMPLITUDE = 60;
const SINE_PERIOD_MS = 1400;

/**
 * Crow: flies horizontally toward the player while bobbing in a sine wave.
 * Spawned by ScarecrowBoss in Phase 2 and also placed as a Mundo 2 enemy.
 * Tagged 'normal' (not water-weak).
 */
export class Crow extends BaseEnemy {
  readonly tag: 'normal' = 'normal';
  private readonly anchorY: number;
  private timeMs: number = 0;
  private flightDir: Direction;

  constructor(spawnX: number, spawnY: number, flightDir: Direction = Direction.Left, events: EnemyEvents = {}) {
    super(CROW_CONFIG, events);
    this.x = spawnX;
    this.y = spawnY;
    this.anchorY = spawnY;
    this.flightDir = flightDir;
    this.facing = flightDir;
  }

  update(deltaMs: number, _playerX: number, _playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      return;
    }
    this.timeMs += deltaMs;
    this.vx = this.flightDir === Direction.Left ? -this.speed : this.speed;
    const phase = (this.timeMs / SINE_PERIOD_MS) * Math.PI * 2;
    const targetY = this.anchorY + Math.sin(phase) * SINE_AMPLITUDE;
    const dt = Math.max(deltaMs / 1000, 0.001);
    this.vy = (targetY - this.y) / dt;
    this.facing = this.flightDir;
  }

  static get sineAmplitude(): number {
    return SINE_AMPLITUDE;
  }

  static get sinePeriodMs(): number {
    return SINE_PERIOD_MS;
  }
}
