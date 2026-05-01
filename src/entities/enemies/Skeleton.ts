import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const SKELETON_CONFIG = {
  hp: 3,
  damage: 1,
  speed: 50,
};

const PROJECTILE_INTERVAL_MS = 2000;

export interface SkeletonProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface SkeletonEvents extends EnemyEvents {
  onShoot?: (projectile: SkeletonProjectile) => void;
}

export class Skeleton extends BaseEnemy {
  private shootTimerMs: number = PROJECTILE_INTERVAL_MS;
  private readonly skeletonEvents: SkeletonEvents;
  edgeAhead: boolean = false;

  constructor(events: SkeletonEvents = {}) {
    super(SKELETON_CONFIG, events);
    this.skeletonEvents = events;
    this.vx = -SKELETON_CONFIG.speed;
  }

  reportEdge(edgeAhead: boolean): void {
    this.edgeAhead = edgeAhead;
    if (edgeAhead && !this.isDead) {
      this.flipDirection();
    }
  }

  update(deltaMs: number): void {
    if (this.isDead) {
      this.vx = 0;
      return;
    }
    this.vx = this.facing === Direction.Left ? -this.speed : this.speed;

    this.shootTimerMs -= deltaMs;
    if (this.shootTimerMs <= 0) {
      this.shootTimerMs = PROJECTILE_INTERVAL_MS;
      const projectile: SkeletonProjectile = {
        x: this.x,
        y: this.y,
        vx: this.facing === Direction.Left ? -120 : 120,
        vy: 0,
      };
      this.skeletonEvents.onShoot?.(projectile);
    }
  }

  getShootTimer(): number {
    return this.shootTimerMs;
  }
}
