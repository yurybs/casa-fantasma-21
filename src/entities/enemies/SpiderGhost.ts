import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

const SPIDER_GHOST_CONFIG = {
  hp: 2,
  damage: 1,
  speed: 0,
};

const DETECTION_RANGE_X = 80;
const DESCEND_DURATION_MS = 800;
const HOLD_DURATION_MS = 600;
const ASCEND_DURATION_MS = 1000;
const COOLDOWN_MS = 1500;

export type SpiderGhostState = 'idle' | 'descending' | 'holding' | 'ascending' | 'cooldown';

/**
 * SpiderGhost: hangs at the top of the screen, descends on a vertical web
 * when the player walks close in X, holds, then retreats. Bridges Sprint 1
 * patrol enemies and the boss combat by introducing a vertical threat that
 * teaches the player to look up.
 */
export class SpiderGhost extends BaseEnemy {
  readonly tag: 'ghost' = 'ghost';
  state: SpiderGhostState = 'idle';
  /** World Y the spider hangs at when at rest. */
  readonly anchorY: number;
  /** Y the spider descends to (set as anchorY + descendDistance). */
  readonly descendDistance: number;
  private stateTimerMs: number = 0;

  constructor(anchorY: number, descendDistance: number = 160, events: EnemyEvents = {}) {
    super(SPIDER_GHOST_CONFIG, events);
    this.anchorY = anchorY;
    this.y = anchorY;
    this.descendDistance = descendDistance;
  }

  update(deltaMs: number, playerX: number, _playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    this.facing = playerX < this.x ? Direction.Left : Direction.Right;
    this.stateTimerMs += deltaMs;

    const dxAbs = Math.abs(playerX - this.x);
    const targetBottom = this.anchorY + this.descendDistance;

    if (this.state === 'idle' && dxAbs <= DETECTION_RANGE_X) {
      this.state = 'descending';
      this.stateTimerMs = 0;
    }

    switch (this.state) {
      case 'idle': {
        this.vx = 0;
        this.vy = 0;
        return;
      }
      case 'descending': {
        const speed = this.descendDistance / (DESCEND_DURATION_MS / 1000);
        this.vx = 0;
        this.vy = speed;
        if (this.y >= targetBottom || this.stateTimerMs >= DESCEND_DURATION_MS) {
          this.y = targetBottom;
          this.vy = 0;
          this.state = 'holding';
          this.stateTimerMs = 0;
        }
        return;
      }
      case 'holding': {
        this.vx = 0;
        this.vy = 0;
        if (this.stateTimerMs >= HOLD_DURATION_MS) {
          this.state = 'ascending';
          this.stateTimerMs = 0;
        }
        return;
      }
      case 'ascending': {
        const speed = this.descendDistance / (ASCEND_DURATION_MS / 1000);
        this.vx = 0;
        this.vy = -speed;
        if (this.y <= this.anchorY || this.stateTimerMs >= ASCEND_DURATION_MS) {
          this.y = this.anchorY;
          this.vy = 0;
          this.state = 'cooldown';
          this.stateTimerMs = 0;
        }
        return;
      }
      case 'cooldown': {
        this.vx = 0;
        this.vy = 0;
        if (this.stateTimerMs >= COOLDOWN_MS) {
          this.state = 'idle';
          this.stateTimerMs = 0;
        }
        return;
      }
    }
  }

  static get detectionRangeX(): number {
    return DETECTION_RANGE_X;
  }
}
