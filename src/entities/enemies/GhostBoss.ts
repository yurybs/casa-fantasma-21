import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

export type GhostBossPhase = 'phase1' | 'phase2';
export type GhostBossState = 'float' | 'dash' | 'recover';

export interface MiniSpawnInfo {
  x: number;
  y: number;
}

export interface GhostBossEvents extends EnemyEvents {
  onPhaseChange?: (phase: GhostBossPhase) => void;
  onSpawnMinis?: (spawns: MiniSpawnInfo[]) => void;
  onDashStart?: () => void;
}

const GHOST_BOSS_HP = 12;
const FLOAT_AMP_X_PHASE1 = 60;
const FLOAT_AMP_X_PHASE2 = 90;
const FLOAT_AMP_Y = 30;
const FLOAT_PERIOD_MS_PHASE1 = 2400;
const FLOAT_PERIOD_MS_PHASE2 = 1700;
const DASH_INTERVAL_MS_PHASE1 = 3500;
const DASH_INTERVAL_MS_PHASE2 = 2200;
const DASH_SPEED = 320;
const DASH_DURATION_MS = 700;
const RECOVER_DURATION_MS = 600;
const PHASE2_HP_THRESHOLD = 6;

/**
 * Boss enemy for Level 2: floats, periodically dash-attacks the player,
 * and at <=50% HP enters Phase 2 — spawns 2 MiniGhosts and attacks faster.
 *
 * Pure logic class (no Phaser). The owner scene reads vx/vy and applies
 * them to the visual sprite, and listens for events to spawn minis.
 */
export class GhostBoss extends BaseEnemy {
  phase: GhostBossPhase = 'phase1';
  state: GhostBossState = 'float';
  /** Tag used by water-element shots to apply 2x damage. */
  readonly tag: 'ghost' = 'ghost';
  isInvulnerable: boolean = false;

  private floatTimerMs: number = 0;
  private dashCooldownMs: number;
  private stateTimerMs: number = 0;
  private dashTargetVx: number = 0;
  private dashTargetVy: number = 0;
  private hasSpawnedMinisThisPhase: boolean = false;

  private readonly originX: number;
  private readonly originY: number;
  private readonly bossEvents: GhostBossEvents;

  constructor(originX: number, originY: number, events: GhostBossEvents = {}) {
    super({ hp: GHOST_BOSS_HP, damage: 1, speed: 0 }, events);
    this.originX = originX;
    this.originY = originY;
    this.x = originX;
    this.y = originY;
    this.dashCooldownMs = DASH_INTERVAL_MS_PHASE1;
    this.bossEvents = events;
  }

  /** Apply damage; water-element callers should multiply *before* calling. */
  takeDamage(damage: number): boolean {
    if (this.isInvulnerable) return false;
    const wasAlive = !this.isDead;
    const died = super.takeDamage(damage);
    if (wasAlive && !died && this.phase === 'phase1' && this.hp <= PHASE2_HP_THRESHOLD) {
      this.enterPhase2();
    }
    return died;
  }

  private enterPhase2(): void {
    this.phase = 'phase2';
    this.dashCooldownMs = DASH_INTERVAL_MS_PHASE2;
    this.bossEvents.onPhaseChange?.('phase2');
    if (!this.hasSpawnedMinisThisPhase) {
      this.hasSpawnedMinisThisPhase = true;
      this.bossEvents.onSpawnMinis?.([
        { x: this.x - 40, y: this.y },
        { x: this.x + 40, y: this.y },
      ]);
    }
  }

  update(deltaMs: number, playerX: number, playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    this.stateTimerMs += deltaMs;
    this.dashCooldownMs -= deltaMs;

    if (this.state === 'float') {
      this.updateFloat(deltaMs);
      if (this.dashCooldownMs <= 0) {
        this.startDash(playerX, playerY);
      }
    }
    if (this.state === 'dash') {
      this.vx = this.dashTargetVx;
      this.vy = this.dashTargetVy;
      if (this.stateTimerMs >= DASH_DURATION_MS) {
        this.state = 'recover';
        this.stateTimerMs = 0;
        this.vx = 0;
        this.vy = 0;
      }
    } else if (this.state === 'recover') {
      this.vx = 0;
      this.vy = 0;
      if (this.stateTimerMs >= RECOVER_DURATION_MS) {
        this.state = 'float';
        this.stateTimerMs = 0;
        this.dashCooldownMs =
          this.phase === 'phase1' ? DASH_INTERVAL_MS_PHASE1 : DASH_INTERVAL_MS_PHASE2;
      }
    }

    this.facing = playerX < this.x ? Direction.Left : Direction.Right;
  }

  private updateFloat(deltaMs: number): void {
    this.floatTimerMs += deltaMs;
    const period =
      this.phase === 'phase1' ? FLOAT_PERIOD_MS_PHASE1 : FLOAT_PERIOD_MS_PHASE2;
    const ampX = this.phase === 'phase1' ? FLOAT_AMP_X_PHASE1 : FLOAT_AMP_X_PHASE2;
    const t = (this.floatTimerMs / period) * Math.PI * 2;
    const targetX = this.originX + Math.sin(t) * ampX;
    const targetY = this.originY + Math.cos(t) * FLOAT_AMP_Y;
    const dt = Math.max(deltaMs / 1000, 0.001);
    this.vx = (targetX - this.x) / dt;
    this.vy = (targetY - this.y) / dt;
    const max = 220;
    this.vx = Math.max(-max, Math.min(max, this.vx));
    this.vy = Math.max(-max, Math.min(max, this.vy));
  }

  private startDash(playerX: number, playerY: number): void {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const len = Math.max(Math.hypot(dx, dy), 1);
    this.dashTargetVx = (dx / len) * DASH_SPEED;
    this.dashTargetVy = (dy / len) * DASH_SPEED;
    this.state = 'dash';
    this.stateTimerMs = 0;
    this.bossEvents.onDashStart?.();
  }

  static get phase2HpThreshold(): number {
    return PHASE2_HP_THRESHOLD;
  }

  static get maxHp(): number {
    return GHOST_BOSS_HP;
  }
}
