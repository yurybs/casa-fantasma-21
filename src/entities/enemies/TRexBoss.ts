import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

export type TRexBossPhase = 'phase1' | 'phase2' | 'phase3';
export type TRexBossState = 'walking' | 'roaring' | 'charging' | 'recovering' | 'shockwaving';

export interface ShockwaveSpawn {
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  damage: number;
  ttlMs: number;
}

export interface MiniTRexSpawn {
  x: number;
  y: number;
}

export interface TRexBossEvents extends EnemyEvents {
  onPhaseChange?: (phase: TRexBossPhase) => void;
  onRoar?: (intensity: number, durationMs: number) => void;
  onChargeStart?: (direction: Direction) => void;
  onShockwave?: (waves: ShockwaveSpawn[]) => void;
  onSpawnMiniTRex?: (spawns: MiniTRexSpawn[]) => void;
}

const TREX_BOSS_HP = 28;
const PHASE2_HP_THRESHOLD = 18; // ~64% — enters charging phase
const PHASE3_HP_THRESHOLD = 9;  // ~32% — enters shockwave phase

const WALK_SPEED_PHASE1 = 55;
const WALK_SPEED_PHASE2 = 70;
const WALK_SPEED_PHASE3 = 60;
const CHARGE_SPEED = 280;

const PATROL_RANGE = 180;
const CHARGE_DURATION_MS = 1400;
const RECOVER_DURATION_MS = 900;

const ROAR_INTERVAL_MS_PHASE1 = 4500;
const ROAR_INTERVAL_MS_PHASE2 = 3500;
const ROAR_INTERVAL_MS_PHASE3 = 3000;
const ROAR_DURATION_MS = 600;
const ROAR_SHAKE_INTENSITY = 12;
const ROAR_SHAKE_INTENSITY_PHASE3 = 18;

const CHARGE_INTERVAL_MS_PHASE2 = 5500;
const CHARGE_INTERVAL_MS_PHASE3 = 4500;

const SHOCKWAVE_INTERVAL_MS = 4500;
const SHOCKWAVE_SPEED = 180;
const SHOCKWAVE_TTL_MS = 1800;
const SHOCKWAVE_DAMAGE = 1;

/**
 * TRexBoss (Level 9): three-phase boss in the abandoned-city arena.
 *
 * - Phase 1 (HP 28→18): heavy walking patrol, periodic roar that shakes
 *   the camera. Damage by contact.
 * - Phase 2 (HP 18→9): roar still triggers shake; adds a full-arena
 *   horizontal charge attack with a brief recover window where it is
 *   vulnerable to player counter-attack. Spawns 2 MiniTRex on entry.
 * - Phase 3 (HP <=6): roar shockwave — emits two ground-crawling
 *   shockwaves left + right that damage the player on the ground.
 *   Charge and walk both faster; roar shake is stronger.
 *
 * Pure logic — emits spawn/event callbacks to the owner scene which
 * applies physics, sprites, camera shake, and the shockwave hitboxes.
 */
export class TRexBoss extends BaseEnemy {
  readonly tag: 'normal' = 'normal';
  phase: TRexBossPhase = 'phase1';
  state: TRexBossState = 'walking';
  isInvulnerable: boolean = false;

  private readonly originX: number;
  private readonly groundY: number;
  private readonly bossEvents: TRexBossEvents;
  private patrolDir: Direction = Direction.Left;
  private roarCooldownMs: number;
  private chargeCooldownMs: number = CHARGE_INTERVAL_MS_PHASE2;
  private shockwaveCooldownMs: number = SHOCKWAVE_INTERVAL_MS;
  private stateTimerMs: number = 0;
  private chargeDir: Direction = Direction.Left;
  private spawnedMinisOnce: boolean = false;

  constructor(originX: number, groundY: number, events: TRexBossEvents = {}) {
    super({ hp: TREX_BOSS_HP, damage: 2, speed: WALK_SPEED_PHASE1 }, events);
    this.originX = originX;
    this.groundY = groundY;
    this.x = originX;
    this.y = groundY;
    this.bossEvents = events;
    this.roarCooldownMs = ROAR_INTERVAL_MS_PHASE1;
  }

  takeDamage(damage: number): boolean {
    // Vulnerable bonus: hits during 'recovering' get +50% damage
    // (rounded down) — rewards the player for waiting out a charge.
    const effective = this.state === 'recovering' ? Math.floor(damage * 1.5) : damage;
    if (this.isInvulnerable) return false;
    const wasAlive = !this.isDead;
    const died = super.takeDamage(effective);
    if (!wasAlive || died) return died;

    if (this.phase === 'phase1' && this.hp <= PHASE2_HP_THRESHOLD) {
      this.enterPhase2();
    }
    if (this.phase === 'phase2' && this.hp <= PHASE3_HP_THRESHOLD) {
      this.enterPhase3();
    }
    return died;
  }

  private enterPhase2(): void {
    this.phase = 'phase2';
    this.roarCooldownMs = ROAR_INTERVAL_MS_PHASE2;
    this.chargeCooldownMs = CHARGE_INTERVAL_MS_PHASE2;
    this.bossEvents.onPhaseChange?.('phase2');
    if (!this.spawnedMinisOnce) {
      this.spawnedMinisOnce = true;
      this.bossEvents.onSpawnMiniTRex?.([
        { x: this.originX - 100, y: this.groundY },
        { x: this.originX + 100, y: this.groundY },
      ]);
    }
  }

  private enterPhase3(): void {
    this.phase = 'phase3';
    this.roarCooldownMs = ROAR_INTERVAL_MS_PHASE3;
    this.chargeCooldownMs = CHARGE_INTERVAL_MS_PHASE3;
    this.shockwaveCooldownMs = SHOCKWAVE_INTERVAL_MS;
    this.bossEvents.onPhaseChange?.('phase3');
  }

  update(deltaMs: number, playerX: number, _playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    this.stateTimerMs += deltaMs;
    this.roarCooldownMs -= deltaMs;
    if (this.phase !== 'phase1') this.chargeCooldownMs -= deltaMs;
    if (this.phase === 'phase3') this.shockwaveCooldownMs -= deltaMs;

    if (this.state === 'walking') {
      this.updateWalking(playerX);
      if (this.roarCooldownMs <= 0) {
        this.startRoar();
      } else if (this.phase !== 'phase1' && this.chargeCooldownMs <= 0) {
        this.startCharge(playerX);
      }
    } else if (this.state === 'roaring') {
      this.vx = 0;
      this.vy = 0;
      if (this.stateTimerMs >= ROAR_DURATION_MS) {
        // Phase-3 roar emits shockwave if its cooldown also expired
        if (this.phase === 'phase3' && this.shockwaveCooldownMs <= 0) {
          this.emitShockwave();
        }
        this.state = 'walking';
        this.stateTimerMs = 0;
        this.roarCooldownMs = this.currentRoarInterval();
      }
    } else if (this.state === 'charging') {
      this.vx = this.chargeDir === Direction.Left ? -CHARGE_SPEED : CHARGE_SPEED;
      this.facing = this.chargeDir;
      this.vy = 0;
      if (this.stateTimerMs >= CHARGE_DURATION_MS) {
        this.state = 'recovering';
        this.stateTimerMs = 0;
        this.vx = 0;
      }
    } else if (this.state === 'recovering') {
      this.vx = 0;
      this.vy = 0;
      if (this.stateTimerMs >= RECOVER_DURATION_MS) {
        this.state = 'walking';
        this.stateTimerMs = 0;
        this.chargeCooldownMs = this.currentChargeInterval();
      }
    } else if (this.state === 'shockwaving') {
      this.vx = 0;
      this.vy = 0;
      if (this.stateTimerMs >= ROAR_DURATION_MS) {
        this.state = 'walking';
        this.stateTimerMs = 0;
        this.shockwaveCooldownMs = SHOCKWAVE_INTERVAL_MS;
      }
    }
  }

  private updateWalking(playerX: number): void {
    const speed = this.currentWalkSpeed();
    if (this.x <= this.originX - PATROL_RANGE) this.patrolDir = Direction.Right;
    else if (this.x >= this.originX + PATROL_RANGE) this.patrolDir = Direction.Left;
    // In phases 2-3, walking aggressively faces the player
    if (this.phase !== 'phase1') {
      this.patrolDir = playerX < this.x ? Direction.Left : Direction.Right;
    }
    this.facing = this.patrolDir;
    this.vx = this.patrolDir === Direction.Left ? -speed : speed;
    this.vy = 0;
  }

  private startRoar(): void {
    this.state = 'roaring';
    this.stateTimerMs = 0;
    this.vx = 0;
    const intensity = this.phase === 'phase3' ? ROAR_SHAKE_INTENSITY_PHASE3 : ROAR_SHAKE_INTENSITY;
    this.bossEvents.onRoar?.(intensity, ROAR_DURATION_MS);
  }

  private startCharge(playerX: number): void {
    this.state = 'charging';
    this.stateTimerMs = 0;
    this.chargeDir = playerX < this.x ? Direction.Left : Direction.Right;
    this.facing = this.chargeDir;
    // Set vx immediately so the very frame that starts the charge already
    // moves at full speed (otherwise the first frame uses stale walking speed).
    this.vx = this.chargeDir === Direction.Left ? -CHARGE_SPEED : CHARGE_SPEED;
    this.bossEvents.onChargeStart?.(this.chargeDir);
  }

  private emitShockwave(): void {
    this.state = 'shockwaving';
    this.stateTimerMs = 0;
    const baseY = this.groundY + 4;
    this.bossEvents.onShockwave?.([
      {
        x: this.x - 40,
        y: baseY,
        direction: Direction.Left,
        speed: SHOCKWAVE_SPEED,
        damage: SHOCKWAVE_DAMAGE,
        ttlMs: SHOCKWAVE_TTL_MS,
      },
      {
        x: this.x + 40,
        y: baseY,
        direction: Direction.Right,
        speed: SHOCKWAVE_SPEED,
        damage: SHOCKWAVE_DAMAGE,
        ttlMs: SHOCKWAVE_TTL_MS,
      },
    ]);
  }

  private currentWalkSpeed(): number {
    if (this.phase === 'phase1') return WALK_SPEED_PHASE1;
    if (this.phase === 'phase2') return WALK_SPEED_PHASE2;
    return WALK_SPEED_PHASE3;
  }

  private currentRoarInterval(): number {
    if (this.phase === 'phase1') return ROAR_INTERVAL_MS_PHASE1;
    if (this.phase === 'phase2') return ROAR_INTERVAL_MS_PHASE2;
    return ROAR_INTERVAL_MS_PHASE3;
  }

  private currentChargeInterval(): number {
    return this.phase === 'phase2' ? CHARGE_INTERVAL_MS_PHASE2 : CHARGE_INTERVAL_MS_PHASE3;
  }

  static get maxHp(): number {
    return TREX_BOSS_HP;
  }

  static get phase2HpThreshold(): number {
    return PHASE2_HP_THRESHOLD;
  }

  static get phase3HpThreshold(): number {
    return PHASE3_HP_THRESHOLD;
  }

  static get chargeSpeed(): number {
    return CHARGE_SPEED;
  }

  static get shockwaveSpeed(): number {
    return SHOCKWAVE_SPEED;
  }

  static get shockwaveTtlMs(): number {
    return SHOCKWAVE_TTL_MS;
  }
}
