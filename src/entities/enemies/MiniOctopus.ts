import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const MINI_OCTOPUS_CONFIG = {
  hp: 2,
  damage: 1,
  speed: 70,
};

const DETECTION_RANGE = 240;

/**
 * MiniOctopus: slow ground crawler spawned by the OctopusBoss on Phase 2
 * entry and placed as a common enemy in Mundo 4. Chases the player when in
 * detection range, otherwise patrols slowly in its current facing.
 * Tagged 'normal'.
 */
export class MiniOctopus extends BaseEnemy {
  readonly tag: 'normal' = 'normal';
  isChasing: boolean = false;

  constructor(events: EnemyEvents = {}) {
    super(MINI_OCTOPUS_CONFIG, events);
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
      this.vx = this.facing === Direction.Left ? -this.speed * 0.5 : this.speed * 0.5;
    }
  }

  static get detectionRange(): number {
    return DETECTION_RANGE;
  }
}
