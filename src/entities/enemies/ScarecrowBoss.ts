import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

export type ScarecrowBossPhase = 'phase1' | 'phase2';
export type ScarecrowBossState = 'idle' | 'extending' | 'retracting' | 'rotating';

export interface CrowSpawnInfo {
  x: number;
  y: number;
  direction: Direction;
}

export interface ScarecrowBossEvents extends EnemyEvents {
  onPhaseChange?: (phase: ScarecrowBossPhase) => void;
  onArmStrike?: (info: { reach: number; direction: Direction }) => void;
  onSpawnCrows?: (spawns: CrowSpawnInfo[]) => void;
  onRotateStart?: () => void;
}

const SCARECROW_BOSS_HP = 18;
const PHASE2_HP_THRESHOLD = Math.floor(SCARECROW_BOSS_HP * 0.4);
const ARM_REACH_TILES = 3;
const TILE_PIXELS = 16;
const ARM_REACH_PX = ARM_REACH_TILES * TILE_PIXELS;
const ARM_EXTEND_INTERVAL_MS_PHASE1 = 3200;
const ARM_EXTEND_INTERVAL_MS_PHASE2 = 2200;
const ARM_EXTEND_DURATION_MS = 500;
const ARM_RETRACT_DURATION_MS = 350;
const CROW_SPAWN_INTERVAL_MS = 5000;
const CROW_SPAWN_INTERVAL_MS_PHASE2 = 3500;
const ROTATION_DURATION_MS = 1400;
const ROTATION_INTERVAL_MS = 7000;

/**
 * ScarecrowBoss (Level 6): stationary boss whose arms extend horizontally
 * 3 tiles, summons crows on a sinusoidal path, and at <=40% HP enters
 * Phase 2 with 360° body rotation that damages by sweep.
 *
 * Pure logic — owner scene reads state/timers and applies visuals
 * (arm extension as a damage zone, body rotation, etc).
 */
export class ScarecrowBoss extends BaseEnemy {
  readonly tag: 'normal' = 'normal';
  phase: ScarecrowBossPhase = 'phase1';
  state: ScarecrowBossState = 'idle';
  isInvulnerable: boolean = false;
  isRotating: boolean = false;
  /** 0..1: how far the arm is currently extended (visual + hitbox length). */
  armExtension: number = 0;
  /** Direction the arm is currently extending toward. */
  armDirection: Direction = Direction.Left;

  private readonly anchorX: number;
  private readonly anchorY: number;
  private readonly bossEvents: ScarecrowBossEvents;
  private armCooldownMs: number;
  private crowCooldownMs: number;
  private rotateCooldownMs: number;
  private stateTimerMs: number = 0;

  constructor(anchorX: number, anchorY: number, events: ScarecrowBossEvents = {}) {
    super({ hp: SCARECROW_BOSS_HP, damage: 1, speed: 0 }, events);
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.x = anchorX;
    this.y = anchorY;
    this.bossEvents = events;
    this.armCooldownMs = ARM_EXTEND_INTERVAL_MS_PHASE1;
    this.crowCooldownMs = CROW_SPAWN_INTERVAL_MS;
    this.rotateCooldownMs = ROTATION_INTERVAL_MS;
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
    this.armCooldownMs = ARM_EXTEND_INTERVAL_MS_PHASE2;
    this.crowCooldownMs = CROW_SPAWN_INTERVAL_MS_PHASE2;
    this.bossEvents.onPhaseChange?.('phase2');
  }

  update(deltaMs: number, playerX: number, _playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      this.armExtension = 0;
      this.isRotating = false;
      return;
    }

    this.x = this.anchorX;
    this.y = this.anchorY;
    this.vx = 0;
    this.vy = 0;
    this.facing = playerX < this.x ? Direction.Left : Direction.Right;

    this.stateTimerMs += deltaMs;
    this.armCooldownMs -= deltaMs;
    this.crowCooldownMs -= deltaMs;
    if (this.phase === 'phase2') this.rotateCooldownMs -= deltaMs;

    if (this.crowCooldownMs <= 0) this.spawnCrowWave();

    if (this.state === 'idle') {
      if (this.phase === 'phase2' && this.rotateCooldownMs <= 0 && !this.isRotating) {
        this.startRotation();
      } else if (this.armCooldownMs <= 0) {
        this.startArmStrike();
      }
    } else if (this.state === 'extending') {
      this.armExtension = Math.min(1, this.stateTimerMs / ARM_EXTEND_DURATION_MS);
      if (this.stateTimerMs >= ARM_EXTEND_DURATION_MS) {
        this.armExtension = 1;
        this.bossEvents.onArmStrike?.({ reach: ARM_REACH_PX, direction: this.armDirection });
        this.state = 'retracting';
        this.stateTimerMs = 0;
      }
    } else if (this.state === 'retracting') {
      this.armExtension = Math.max(0, 1 - this.stateTimerMs / ARM_RETRACT_DURATION_MS);
      if (this.stateTimerMs >= ARM_RETRACT_DURATION_MS) {
        this.armExtension = 0;
        this.state = 'idle';
        this.stateTimerMs = 0;
        this.armCooldownMs =
          this.phase === 'phase1'
            ? ARM_EXTEND_INTERVAL_MS_PHASE1
            : ARM_EXTEND_INTERVAL_MS_PHASE2;
      }
    } else if (this.state === 'rotating') {
      this.isRotating = true;
      if (this.stateTimerMs >= ROTATION_DURATION_MS) {
        this.isRotating = false;
        this.state = 'idle';
        this.stateTimerMs = 0;
        this.rotateCooldownMs = ROTATION_INTERVAL_MS;
      }
    }
  }

  private startArmStrike(): void {
    this.state = 'extending';
    this.stateTimerMs = 0;
    this.armExtension = 0;
    this.armDirection = this.facing;
  }

  private startRotation(): void {
    this.state = 'rotating';
    this.stateTimerMs = 0;
    this.bossEvents.onRotateStart?.();
  }

  private spawnCrowWave(): void {
    const dir = this.facing;
    const baseY = this.anchorY - 30;
    const spawnX = this.anchorX + (dir === Direction.Left ? 60 : -60);
    this.bossEvents.onSpawnCrows?.([
      { x: spawnX, y: baseY - 20, direction: dir },
      { x: spawnX + (dir === Direction.Left ? 30 : -30), y: baseY + 20, direction: dir },
    ]);
    this.crowCooldownMs =
      this.phase === 'phase1' ? CROW_SPAWN_INTERVAL_MS : CROW_SPAWN_INTERVAL_MS_PHASE2;
  }

  /** Hitbox length in pixels for the arm during 'extending'/'retracting'/full reach. */
  getArmHitboxLength(): number {
    return ARM_REACH_PX * this.armExtension;
  }

  static get maxHp(): number {
    return SCARECROW_BOSS_HP;
  }

  static get phase2HpThreshold(): number {
    return PHASE2_HP_THRESHOLD;
  }

  static get armReachTiles(): number {
    return ARM_REACH_TILES;
  }

  static get armReachPx(): number {
    return ARM_REACH_PX;
  }
}
