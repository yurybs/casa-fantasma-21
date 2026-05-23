import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const MINI_TREX_CONFIG = {
  hp: 2,
  damage: 1,
  speed: 90,
};

const DETECTION_RANGE = 280;

/**
 * MiniTRex: ground enemy spawned by TRexBoss on Phase 2 entry. Chases the
 * player when in detection range, walks aggressively when in range, and
 * patrols slowly otherwise. Tagged 'normal'.
 */
export class MiniTRex extends BaseEnemy {
  readonly tag: 'normal' = 'normal';
  isChasing: boolean = false;

  constructor(events: EnemyEvents = {}) {
    super(MINI_TREX_CONFIG, events);
  }

  update(_deltaMs: number, playerX: number, _playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      return;
    }
    const dx = playerX - this.x;
    const distance = Math.abs(dx);

    if (distance <= DETECTION_RANGE) {
      this.isChasing = true;
      this.facing = dx < 0 ? Direction.Left : Direction.Right;
      this.vx = this.facing === Direction.Left ? -this.speed : this.speed;
    } else {
      this.isChasing = false;
      // Slow patrol — keeps facing direction, half speed
      this.vx = this.facing === Direction.Left ? -this.speed * 0.4 : this.speed * 0.4;
    }
  }

  static get detectionRange(): number {
    return DETECTION_RANGE;
  }
}
