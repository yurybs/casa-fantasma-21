import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const MINI_VAMPIRE_CONFIG = {
  hp: 2,
  damage: 1,
  speed: 85,
};

const DETECTION_RANGE = 260;
const BOB_AMPLITUDE = 22;
const BOB_FREQ = 0.004;

/**
 * MiniVampire: small flying vampire spawned by the VampireBoss on Phase 2
 * entry and placed as a common enemy in levels 10–12. Hovers with a
 * sinusoidal bob; when the player is within detection range it drifts
 * toward them horizontally. Tagged 'ghost' — water shots deal 2x damage.
 */
export class MiniVampire extends BaseEnemy {
  readonly tag: 'ghost' = 'ghost';
  isChasing: boolean = false;

  private timeMs: number = 0;

  constructor(events: EnemyEvents = {}) {
    super(MINI_VAMPIRE_CONFIG, events);
  }

  update(deltaMs: number, playerX: number, _playerY: number): void {
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
    } else {
      this.isChasing = false;
      // Slow drift keeping the current facing.
      this.vx = this.facing === Direction.Left ? -this.speed * 0.35 : this.speed * 0.35;
    }
    this.vy = Math.sin(this.timeMs * BOB_FREQ) * BOB_AMPLITUDE;
  }

  static get detectionRange(): number {
    return DETECTION_RANGE;
  }
}
