import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const MINI_CLOWN_CONFIG = {
  hp: 1,
  damage: 1,
  speed: 110,
};

const HOP_INTERVAL_MS = 1100;
const HOP_VY = -260;
const DETECTION_RANGE = 240;

/**
 * MiniClown: hops toward the player at HOP_INTERVAL_MS. Spawned by ClownBoss
 * in Phase 2. Dies in one hit. Tagged 'normal'.
 */
export class MiniClown extends BaseEnemy {
  readonly tag: 'normal' = 'normal';
  private hopTimerMs: number = HOP_INTERVAL_MS;

  constructor(events: EnemyEvents = {}) {
    super(MINI_CLOWN_CONFIG, events);
  }

  update(deltaMs: number, playerX: number, _playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      return;
    }
    const dx = playerX - this.x;
    if (Math.abs(dx) > DETECTION_RANGE) {
      this.vx = 0;
      return;
    }
    this.facing = dx < 0 ? Direction.Left : Direction.Right;
    this.vx = this.facing === Direction.Left ? -this.speed : this.speed;
    this.hopTimerMs -= deltaMs;
    if (this.hopTimerMs <= 0 && this.isOnGround) {
      this.hopTimerMs = HOP_INTERVAL_MS;
      this.vy = HOP_VY;
      this.isOnGround = false;
    }
  }

  static get hopIntervalMs(): number {
    return HOP_INTERVAL_MS;
  }
}
