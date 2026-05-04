import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const MINI_SCARECROW_CONFIG = {
  hp: 2,
  damage: 1,
  speed: 50,
};

const DETECTION_RANGE = 300;

/**
 * MiniScarecrow: slow ground patrol that turns to chase the player when
 * within DETECTION_RANGE. Spawned by ScarecrowBoss (or placed in level 6).
 * Tagged 'normal'.
 */
export class MiniScarecrow extends BaseEnemy {
  readonly tag: 'normal' = 'normal';

  constructor(events: EnemyEvents = {}) {
    super(MINI_SCARECROW_CONFIG, events);
    this.facing = Direction.Left;
  }

  update(_deltaMs: number, playerX: number, _playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      return;
    }
    const dx = playerX - this.x;
    if (Math.abs(dx) <= DETECTION_RANGE) {
      this.facing = dx < 0 ? Direction.Left : Direction.Right;
    }
    this.vx = this.facing === Direction.Left ? -this.speed : this.speed;
  }
}
