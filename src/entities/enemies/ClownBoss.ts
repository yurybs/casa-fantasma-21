import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

export type ClownBossPhase = 'phase1' | 'phase2';
export type ClownBossState = 'patrol' | 'jumping' | 'throwing';

export interface JuggleBallSpawn {
  x: number;
  y: number;
  /** Horizontal velocity component. */
  vx: number;
  /** Initial vertical velocity (negative = upward arc). */
  vy: number;
}

export interface MiniClownSpawn {
  x: number;
  y: number;
}

export interface ClownBossEvents extends EnemyEvents {
  onPhaseChange?: (phase: ClownBossPhase) => void;
  onJuggleThrow?: (balls: JuggleBallSpawn[]) => void;
  onSpawnMiniClowns?: (spawns: MiniClownSpawn[]) => void;
  onConfusionStart?: () => void;
  onConfusionEnd?: () => void;
  onJump?: () => void;
}

const CLOWN_BOSS_HP = 12;
const PHASE2_HP_THRESHOLD = 6;
const PATROL_SPEED_PHASE1 = 80;
const PATROL_SPEED_PHASE2 = 130;
const JUMP_INTERVAL_MS_PHASE1 = 5000;
const JUMP_INTERVAL_MS_PHASE2 = 3500;
const JUMP_DURATION_MS = 700;
const JUMP_VY = -360;
const THROW_INTERVAL_MS_PHASE1 = 3500;
const THROW_INTERVAL_MS_PHASE2 = 2300;
const THROW_DURATION_MS = 400;
const PATROL_RANGE = 120;
const CONFUSION_PULSE_MS = 6000;

/**
 * ClownBoss (Level 4): patrols left/right, throws 3 juggling balls in arcs,
 * jumps periodically. At <=50% HP enters Phase 2: faster, screen-confusion
 * effect (visual handled by scene), spawns 2 MiniClowns once.
 *
 * Pure logic — emits spawn/event callbacks; the scene applies physics
 * and visuals. Tagged 'normal' (no water bonus).
 */
export class ClownBoss extends BaseEnemy {
  readonly tag: 'normal' = 'normal';
  phase: ClownBossPhase = 'phase1';
  state: ClownBossState = 'patrol';
  isInvulnerable: boolean = false;
  isConfusionActive: boolean = false;

  private readonly originX: number;
  private readonly groundY: number;
  private readonly bossEvents: ClownBossEvents;
  private patrolDir: Direction = Direction.Left;
  private jumpCooldownMs: number;
  private throwCooldownMs: number;
  private stateTimerMs: number = 0;
  private confusionPulseTimerMs: number = 0;
  private spawnedMinisOnce: boolean = false;

  constructor(originX: number, groundY: number, events: ClownBossEvents = {}) {
    super({ hp: CLOWN_BOSS_HP, damage: 1, speed: PATROL_SPEED_PHASE1 }, events);
    this.originX = originX;
    this.groundY = groundY;
    this.x = originX;
    this.y = groundY;
    this.bossEvents = events;
    this.jumpCooldownMs = JUMP_INTERVAL_MS_PHASE1;
    this.throwCooldownMs = THROW_INTERVAL_MS_PHASE1;
  }

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
    this.jumpCooldownMs = JUMP_INTERVAL_MS_PHASE2;
    this.throwCooldownMs = THROW_INTERVAL_MS_PHASE2;
    this.isConfusionActive = true;
    this.confusionPulseTimerMs = CONFUSION_PULSE_MS;
    this.bossEvents.onPhaseChange?.('phase2');
    this.bossEvents.onConfusionStart?.();
    if (!this.spawnedMinisOnce) {
      this.spawnedMinisOnce = true;
      this.bossEvents.onSpawnMiniClowns?.([
        { x: this.x - 60, y: this.groundY },
        { x: this.x + 60, y: this.groundY },
      ]);
    }
  }

  update(deltaMs: number, _playerX: number, _playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      if (this.isConfusionActive) {
        this.isConfusionActive = false;
        this.bossEvents.onConfusionEnd?.();
      }
      return;
    }

    this.stateTimerMs += deltaMs;
    this.jumpCooldownMs -= deltaMs;
    this.throwCooldownMs -= deltaMs;

    if (this.isConfusionActive) {
      this.confusionPulseTimerMs -= deltaMs;
      if (this.confusionPulseTimerMs <= 0) {
        this.isConfusionActive = false;
        this.bossEvents.onConfusionEnd?.();
      }
    }

    const speed =
      this.phase === 'phase1' ? PATROL_SPEED_PHASE1 : PATROL_SPEED_PHASE2;

    if (this.state === 'patrol') {
      if (this.x <= this.originX - PATROL_RANGE) this.patrolDir = Direction.Right;
      else if (this.x >= this.originX + PATROL_RANGE) this.patrolDir = Direction.Left;
      this.facing = this.patrolDir;
      this.vx = this.patrolDir === Direction.Left ? -speed : speed;
      this.vy = 0;

      if (this.throwCooldownMs <= 0) {
        this.throwBalls();
      } else if (this.jumpCooldownMs <= 0) {
        this.startJump();
      }
    } else if (this.state === 'throwing') {
      this.vx = 0;
      this.vy = 0;
      if (this.stateTimerMs >= THROW_DURATION_MS) {
        this.state = 'patrol';
        this.stateTimerMs = 0;
        this.throwCooldownMs =
          this.phase === 'phase1' ? THROW_INTERVAL_MS_PHASE1 : THROW_INTERVAL_MS_PHASE2;
      }
    } else if (this.state === 'jumping') {
      // Velocity managed by simple kinematics; scene applies gravity-like apex via vy decay.
      this.vy += 980 * (deltaMs / 1000);
      if (this.stateTimerMs >= JUMP_DURATION_MS) {
        this.state = 'patrol';
        this.stateTimerMs = 0;
        this.y = this.groundY;
        this.vy = 0;
        this.jumpCooldownMs =
          this.phase === 'phase1' ? JUMP_INTERVAL_MS_PHASE1 : JUMP_INTERVAL_MS_PHASE2;
      }
    }
  }

  private throwBalls(): void {
    this.state = 'throwing';
    this.stateTimerMs = 0;
    const baseY = this.y - 20;
    const balls: JuggleBallSpawn[] = [
      { x: this.x, y: baseY, vx: -120, vy: -260 },
      { x: this.x, y: baseY, vx: 0, vy: -320 },
      { x: this.x, y: baseY, vx: 120, vy: -260 },
    ];
    this.bossEvents.onJuggleThrow?.(balls);
  }

  private startJump(): void {
    this.state = 'jumping';
    this.stateTimerMs = 0;
    this.vy = JUMP_VY;
    this.bossEvents.onJump?.();
  }

  static get maxHp(): number {
    return CLOWN_BOSS_HP;
  }

  static get phase2HpThreshold(): number {
    return PHASE2_HP_THRESHOLD;
  }

  static get confusionPulseMs(): number {
    return CONFUSION_PULSE_MS;
  }
}
