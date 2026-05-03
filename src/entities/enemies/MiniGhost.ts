import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const MINI_GHOST_CONFIG = {
  hp: 1,
  damage: 1,
  speed: 90,
};

/**
 * Smaller ghost spawned by GhostBoss in Phase 2. Floats toward the player at
 * a slow chase speed; dies in one hit.
 */
export class MiniGhost extends BaseEnemy {
  readonly tag: 'ghost' = 'ghost';

  constructor(events: EnemyEvents = {}) {
    super(MINI_GHOST_CONFIG, events);
  }

  update(deltaMs: number, playerX: number, playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      return;
    }
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const len = Math.max(Math.hypot(dx, dy), 1);
    this.vx = (dx / len) * this.speed;
    this.vy = (dy / len) * this.speed;
    this.facing = dx < 0 ? Direction.Left : Direction.Right;
    void deltaMs;
  }
}
