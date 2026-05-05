import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const FIRE_GHOST_CONFIG = {
  hp: 2,
  damage: 1,
  speed: 60,
};

const TRAIL_INTERVAL_MS = 250;
const PATROL_RANGE = 80;

export interface FireTrailDrop {
  x: number;
  y: number;
}

export interface FireGhostEvents extends EnemyEvents {
  /** Called every TRAIL_INTERVAL_MS while alive — owner spawns a fire-trail damage zone. */
  onDropTrail?: (drop: FireTrailDrop) => void;
}

/**
 * FireGhost: floats horizontally between two anchor points, leaving fire-trail
 * drops at fixed intervals. The fire trail is what damages the player —
 * the ghost itself is simple contact-damage. Tagged 'ghost' for water 2x.
 */
export class FireGhost extends BaseEnemy {
  readonly tag: 'ghost' = 'ghost';
  private trailTimerMs: number = TRAIL_INTERVAL_MS;
  private readonly originX: number;
  private readonly fireEvents: FireGhostEvents;

  constructor(originX: number, originY: number, events: FireGhostEvents = {}) {
    super(FIRE_GHOST_CONFIG, events);
    this.originX = originX;
    this.x = originX;
    this.y = originY;
    this.facing = Direction.Left;
    this.fireEvents = events;
  }

  update(deltaMs: number, _playerX: number, _playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    if (this.x <= this.originX - PATROL_RANGE) this.facing = Direction.Right;
    else if (this.x >= this.originX + PATROL_RANGE) this.facing = Direction.Left;
    this.vx = this.facing === Direction.Left ? -this.speed : this.speed;
    this.vy = 0;

    this.trailTimerMs -= deltaMs;
    if (this.trailTimerMs <= 0) {
      this.trailTimerMs = TRAIL_INTERVAL_MS;
      this.fireEvents.onDropTrail?.({ x: this.x, y: this.y + 8 });
    }
  }

  static get trailIntervalMs(): number {
    return TRAIL_INTERVAL_MS;
  }

  static get patrolRange(): number {
    return PATROL_RANGE;
  }
}
