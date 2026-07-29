import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const MINI_FIREBALL_CONFIG = {
  hp: 1,
  damage: 1,
  speed: 120,
};

const DETECTION_RANGE = 300;
const BOB_AMPLITUDE = 30;
const BOB_FREQ = 0.006;

/**
 * MiniFireball: small flying flame spawned by the FireballBoss on Phase 2
 * entry and placed as a common enemy in Mundo 4 levels. Bobs erratically and
 * homes toward the player horizontally when in range. Dies in one hit.
 * Tagged 'ghost' — water shots deal 2x (water beats fire).
 */
export class MiniFireball extends BaseEnemy {
  readonly tag: 'ghost' = 'ghost';
  isChasing: boolean = false;

  private timeMs: number = 0;

  constructor(events: EnemyEvents = {}) {
    super(MINI_FIREBALL_CONFIG, events);
  }

  update(deltaMs: number, playerX: number, playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      return;
    }
    this.timeMs += deltaMs;
    const dx = playerX - this.x;
    const distance = Math.abs(dx);

    if (distance <= DETECTION_RANGE) {
      this.isChasing = true;
      this.facing = dx < 0 ? Direction.Left : Direction.Right;
      this.vx = this.facing === Direction.Left ? -this.speed : this.speed;
      // Slight vertical homing toward the player on top of the bob.
      const dy = playerY - this.y;
      this.vy = Math.sin(this.timeMs * BOB_FREQ) * BOB_AMPLITUDE + Math.sign(dy) * 20;
    } else {
      this.isChasing = false;
      this.vx = this.facing === Direction.Left ? -this.speed * 0.4 : this.speed * 0.4;
      this.vy = Math.sin(this.timeMs * BOB_FREQ) * BOB_AMPLITUDE;
    }
  }

  static get detectionRange(): number {
    return DETECTION_RANGE;
  }
}
