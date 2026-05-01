import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const ZOMBIE_CONFIG = {
  hp: 5,
  damage: 1,
  speed: 30,
};

const DETECTION_RANGE = 200;

export class Zombie extends BaseEnemy {
  isChasing: boolean = false;

  constructor(events: EnemyEvents = {}) {
    super(ZOMBIE_CONFIG, events);
  }

  update(deltaMs: number, playerX: number, _playerY: number): void {
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
      this.vx = 0;
    }
  }

  static get detectionRange(): number {
    return DETECTION_RANGE;
  }
}
