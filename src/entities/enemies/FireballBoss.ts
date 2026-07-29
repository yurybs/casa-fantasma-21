import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

export type FireballBossPhase = 'phase1' | 'phase2';
export type FireballBossState = 'drifting' | 'charging' | 'dashing';

export interface FireTrailDrop {
  x: number;
  y: number;
}

export interface ExplosiveSpawn {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface MiniFireballSpawn {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface FireballBossEvents extends EnemyEvents {
  onPhaseChange?: (phase: FireballBossPhase) => void;
  onDropTrail?: (drop: FireTrailDrop) => void;
  onLobExplosive?: (spawn: ExplosiveSpawn) => void;
  onSpawnMiniFireballs?: (spawns: MiniFireballSpawn[]) => void;
  onDashStart?: (direction: Direction) => void;
}

const FIREBALL_BOSS_HP = 22;
const PHASE2_HP_THRESHOLD = 11; // ≤50% — splits + erratic dashes

const DRIFT_SPEED = 90;
const DASH_SPEED = 300;
const BOUNDS_X = 200; // horizontal drift range around origin
const BOUNDS_Y = 90;  // vertical drift range around origin

const TRAIL_INTERVAL_MS = 200;

const LOB_INTERVAL_MS_PHASE1 = 3200;
const LOB_INTERVAL_MS_PHASE2 = 2100;
const EXPLOSIVE_VY = -260;

const DASH_INTERVAL_MS = 4200; // phase 2 only
const CHARGE_DURATION_MS = 500;
const DASH_DURATION_MS = 650;

/**
 * FireballBoss (Level 13): flying boss of the robot castle. Drifts around its
 * origin on a diagonal bounce (like a DVD-logo), continuously dropping a fire
 * trail beneath it, and periodically lobbing an explosive projectile at the
 * player.
 *
 * - Phase 1 (HP 22→11): gentle diagonal drift + fire trail + lobbed explosives.
 * - Phase 2 (HP ≤11): splits — spawns 2 MiniFireballs once — and starts
 *   erratic high-speed dashes toward the player (charge → dash → resume drift).
 *   Explosives are lobbed more frequently.
 *
 * Pure logic — emits trail/explosive/split callbacks; the scene applies
 * sprites, physics and the fire-trail damage zones. Tagged 'ghost' so the
 * water gun deals bonus damage (fire vs water theme).
 */
export class FireballBoss extends BaseEnemy {
  readonly tag: 'ghost' = 'ghost';
  phase: FireballBossPhase = 'phase1';
  state: FireballBossState = 'drifting';

  private readonly originX: number;
  private readonly originY: number;
  private readonly bossEvents: FireballBossEvents;
  private driftVx: number = DRIFT_SPEED;
  private driftVy: number = DRIFT_SPEED * 0.6;
  private trailTimerMs: number = TRAIL_INTERVAL_MS;
  private lobCooldownMs: number = LOB_INTERVAL_MS_PHASE1;
  private dashCooldownMs: number = DASH_INTERVAL_MS;
  private stateTimerMs: number = 0;
  private dashVx: number = 0;
  private dashVy: number = 0;
  private spawnedMinisOnce: boolean = false;

  constructor(originX: number, originY: number, events: FireballBossEvents = {}) {
    super({ hp: FIREBALL_BOSS_HP, damage: 2, speed: DRIFT_SPEED }, events);
    this.originX = originX;
    this.originY = originY;
    this.x = originX;
    this.y = originY;
    this.bossEvents = events;
  }

  takeDamage(damage: number): boolean {
    const wasAlive = !this.isDead;
    const died = super.takeDamage(damage);
    if (!wasAlive || died) return died;
    if (this.phase === 'phase1' && this.hp <= PHASE2_HP_THRESHOLD) {
      this.enterPhase2();
    }
    return died;
  }

  private enterPhase2(): void {
    this.phase = 'phase2';
    this.lobCooldownMs = LOB_INTERVAL_MS_PHASE2;
    this.dashCooldownMs = DASH_INTERVAL_MS;
    // Faster drift in phase 2.
    this.driftVx = (this.driftVx < 0 ? -1 : 1) * DRIFT_SPEED * 1.4;
    this.driftVy = (this.driftVy < 0 ? -1 : 1) * DRIFT_SPEED * 0.9;
    this.bossEvents.onPhaseChange?.('phase2');
    if (!this.spawnedMinisOnce) {
      this.spawnedMinisOnce = true;
      this.bossEvents.onSpawnMiniFireballs?.([
        { x: this.x - 30, y: this.y, vx: -120, vy: -80 },
        { x: this.x + 30, y: this.y, vx: 120, vy: -80 },
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
    this.lobCooldownMs -= deltaMs;
    if (this.phase === 'phase2' && this.state === 'drifting') {
      this.dashCooldownMs -= deltaMs;
    }

    // Fire trail drops continuously, in every state.
    this.trailTimerMs -= deltaMs;
    if (this.trailTimerMs <= 0) {
      this.trailTimerMs = TRAIL_INTERVAL_MS;
      this.bossEvents.onDropTrail?.({ x: this.x, y: this.y + 6 });
    }

    if (this.state === 'drifting') {
      this.updateDrift();
      if (this.lobCooldownMs <= 0) {
        this.lobExplosive(playerX, playerY);
      } else if (this.phase === 'phase2' && this.dashCooldownMs <= 0) {
        this.startCharge(playerX, playerY);
      }
    } else if (this.state === 'charging') {
      if (this.stateTimerMs >= CHARGE_DURATION_MS) {
        this.state = 'dashing';
        this.stateTimerMs = 0;
        // Apply the dash velocity immediately so there is no dead frame.
        this.vx = this.dashVx;
        this.vy = this.dashVy;
      } else {
        this.vx = 0;
        this.vy = 0;
      }
    } else if (this.state === 'dashing') {
      this.vx = this.dashVx;
      this.vy = this.dashVy;
      if (this.stateTimerMs >= DASH_DURATION_MS) {
        this.state = 'drifting';
        this.stateTimerMs = 0;
        this.dashCooldownMs = DASH_INTERVAL_MS;
      }
    }
  }

  private updateDrift(): void {
    // Bounce off an invisible box around the origin (diagonal drift).
    if (this.x <= this.originX - BOUNDS_X) this.driftVx = Math.abs(this.driftVx);
    else if (this.x >= this.originX + BOUNDS_X) this.driftVx = -Math.abs(this.driftVx);
    if (this.y <= this.originY - BOUNDS_Y) this.driftVy = Math.abs(this.driftVy);
    else if (this.y >= this.originY + BOUNDS_Y) this.driftVy = -Math.abs(this.driftVy);
    this.vx = this.driftVx;
    this.vy = this.driftVy;
    this.facing = this.vx < 0 ? Direction.Left : Direction.Right;
  }

  private lobExplosive(playerX: number, playerY: number): void {
    this.lobCooldownMs =
      this.phase === 'phase2' ? LOB_INTERVAL_MS_PHASE2 : LOB_INTERVAL_MS_PHASE1;
    // Aim a lobbed arc toward the player: horizontal velocity toward them,
    // fixed upward vy so it arcs down onto them.
    const dx = playerX - this.x;
    const vx = Math.max(-180, Math.min(180, dx * 0.6));
    this.bossEvents.onLobExplosive?.({ x: this.x, y: this.y + 8, vx, vy: EXPLOSIVE_VY });
    void playerY;
  }

  private startCharge(playerX: number, playerY: number): void {
    this.state = 'charging';
    this.stateTimerMs = 0;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.dashVx = (dx / dist) * DASH_SPEED;
    this.dashVy = (dy / dist) * DASH_SPEED;
    this.facing = dx < 0 ? Direction.Left : Direction.Right;
    this.bossEvents.onDashStart?.(this.facing);
  }

  static get maxHpValue(): number {
    return FIREBALL_BOSS_HP;
  }

  static get phase2HpThreshold(): number {
    return PHASE2_HP_THRESHOLD;
  }

  static get trailIntervalMs(): number {
    return TRAIL_INTERVAL_MS;
  }

  static get dashSpeed(): number {
    return DASH_SPEED;
  }
}
