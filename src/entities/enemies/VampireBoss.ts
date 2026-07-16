import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

export type VampireBossPhase = 'phase1' | 'phase2';
export type VampireBossState = 'hovering' | 'swooping' | 'returning';

export interface BatSpawn {
  x: number;
  y: number;
}

export interface MiniVampireSpawn {
  x: number;
  y: number;
}

export interface VampireBossEvents extends EnemyEvents {
  onPhaseChange?: (phase: VampireBossPhase) => void;
  onSpawnBats?: (spawns: BatSpawn[]) => void;
  onSpawnMiniVampires?: (spawns: MiniVampireSpawn[]) => void;
  onLifesteal?: (amount: number, hpAfter: number) => void;
  onLifestealBlocked?: (durationMs: number) => void;
}

const VAMPIRE_BOSS_HP = 16;
const PHASE2_HP_THRESHOLD = 8; // ≤50% — transforms into giant bat

const HOVER_SPEED = 70;
const PHASE2_SPEED_MULTIPLIER = 3;
const HOVER_RANGE = 160;
const HOVER_BOB_AMPLITUDE = 26;
const HOVER_BOB_FREQ = 0.0035;

const BAT_INTERVAL_MS_PHASE1 = 4200;
const BAT_INTERVAL_MS_PHASE2 = 3200;
const BATS_PER_WAVE = 2;

const SWOOP_INTERVAL_MS = 3800;
const SWOOP_DURATION_MS = 1100;
const RETURN_DURATION_MS = 900;

const HITS_PER_LIFESTEAL = 3;
const LIFESTEAL_AMOUNT = 2;
const LIFESTEAL_BLOCK_MS = 5000;

/**
 * VampireBoss (Level 11): two-phase flying boss of the abandoned city.
 *
 * - Phase 1 (HP 16→8): hovers around its origin with a sinusoidal bob,
 *   periodically launching homing bats at the player. Every
 *   HITS_PER_LIFESTEAL successful hits on the player (contact or bat)
 *   heal the boss by LIFESTEAL_AMOUNT HP — unless lifesteal is blocked.
 * - Phase 2 (HP ≤8): transforms into a giant bat — movement speed ×3,
 *   swoops directly at the player, then returns to hover height.
 *   Spawns 2 MiniVampires on entry. Lifesteal keeps working.
 * - Counter: a water projectile hit blocks lifesteal for 5s (the hit
 *   counter also freezes during the block).
 *
 * Pure logic — emits spawn/heal callbacks to the owner scene which
 * applies sprites, physics and HUD feedback.
 */
export class VampireBoss extends BaseEnemy {
  readonly tag: 'ghost' = 'ghost';
  phase: VampireBossPhase = 'phase1';
  state: VampireBossState = 'hovering';

  private readonly originX: number;
  private readonly originY: number;
  private readonly bossEvents: VampireBossEvents;
  private hoverDir: Direction = Direction.Left;
  private timeMs: number = 0;
  private batCooldownMs: number = BAT_INTERVAL_MS_PHASE1;
  private swoopCooldownMs: number = SWOOP_INTERVAL_MS;
  private stateTimerMs: number = 0;
  private swoopTargetX: number = 0;
  private swoopTargetY: number = 0;
  private hitsSinceLifesteal: number = 0;
  private lifestealBlockedMs: number = 0;
  private spawnedMinisOnce: boolean = false;

  constructor(originX: number, originY: number, events: VampireBossEvents = {}) {
    super({ hp: VAMPIRE_BOSS_HP, damage: 2, speed: HOVER_SPEED }, events);
    this.originX = originX;
    this.originY = originY;
    this.x = originX;
    this.y = originY;
    this.bossEvents = events;
  }

  /** True while a water hit is suppressing lifesteal. */
  get isLifestealBlocked(): boolean {
    return this.lifestealBlockedMs > 0;
  }

  /** Hits landed on the player since the last successful lifesteal. */
  get lifestealHitCount(): number {
    return this.hitsSinceLifesteal;
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

  /**
   * Called by the scene every time the boss (or one of its bats) lands a
   * hit on the player. Every HITS_PER_LIFESTEAL hits the boss heals
   * LIFESTEAL_AMOUNT HP (capped at maxHp). Hits while blocked don't count.
   */
  registerHitOnPlayer(): void {
    if (this.isDead || this.isLifestealBlocked) return;
    this.hitsSinceLifesteal += 1;
    if (this.hitsSinceLifesteal >= HITS_PER_LIFESTEAL) {
      this.hitsSinceLifesteal = 0;
      const healed = Math.min(this.maxHp - this.hp, LIFESTEAL_AMOUNT);
      if (healed > 0) {
        this.hp += healed;
        this.bossEvents.onLifesteal?.(healed, this.hp);
      }
    }
  }

  /** Water-projectile counter: suppresses lifesteal for LIFESTEAL_BLOCK_MS. */
  blockLifesteal(durationMs: number = LIFESTEAL_BLOCK_MS): void {
    if (this.isDead) return;
    this.lifestealBlockedMs = durationMs;
    this.bossEvents.onLifestealBlocked?.(durationMs);
  }

  private enterPhase2(): void {
    this.phase = 'phase2';
    this.state = 'hovering';
    this.stateTimerMs = 0;
    this.batCooldownMs = BAT_INTERVAL_MS_PHASE2;
    this.swoopCooldownMs = SWOOP_INTERVAL_MS;
    this.bossEvents.onPhaseChange?.('phase2');
    if (!this.spawnedMinisOnce) {
      this.spawnedMinisOnce = true;
      this.bossEvents.onSpawnMiniVampires?.([
        { x: this.originX - 90, y: this.originY },
        { x: this.originX + 90, y: this.originY },
      ]);
    }
  }

  update(deltaMs: number, playerX: number, playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    this.timeMs += deltaMs;
    this.stateTimerMs += deltaMs;
    this.batCooldownMs -= deltaMs;
    if (this.lifestealBlockedMs > 0) {
      this.lifestealBlockedMs = Math.max(0, this.lifestealBlockedMs - deltaMs);
    }
    if (this.phase === 'phase2' && this.state === 'hovering') {
      this.swoopCooldownMs -= deltaMs;
    }

    if (this.batCooldownMs <= 0) {
      this.batCooldownMs =
        this.phase === 'phase2' ? BAT_INTERVAL_MS_PHASE2 : BAT_INTERVAL_MS_PHASE1;
      const spawns: BatSpawn[] = [];
      for (let i = 0; i < BATS_PER_WAVE; i++) {
        spawns.push({ x: this.x + (i === 0 ? -20 : 20), y: this.y - 10 });
      }
      this.bossEvents.onSpawnBats?.(spawns);
    }

    if (this.state === 'hovering') {
      this.updateHovering(playerX);
      if (this.phase === 'phase2' && this.swoopCooldownMs <= 0) {
        this.startSwoop(playerX, playerY);
      }
    } else if (this.state === 'swooping') {
      this.updateSwooping();
    } else if (this.state === 'returning') {
      this.updateReturning();
    }
  }

  private currentSpeed(): number {
    return this.phase === 'phase2' ? HOVER_SPEED * PHASE2_SPEED_MULTIPLIER : HOVER_SPEED;
  }

  private updateHovering(playerX: number): void {
    const speed = this.currentSpeed();
    if (this.x <= this.originX - HOVER_RANGE) this.hoverDir = Direction.Right;
    else if (this.x >= this.originX + HOVER_RANGE) this.hoverDir = Direction.Left;
    this.facing = playerX < this.x ? Direction.Left : Direction.Right;
    this.vx = this.hoverDir === Direction.Left ? -speed : speed;
    this.vy = Math.sin(this.timeMs * HOVER_BOB_FREQ) * HOVER_BOB_AMPLITUDE;
  }

  private startSwoop(playerX: number, playerY: number): void {
    this.state = 'swooping';
    this.stateTimerMs = 0;
    this.swoopTargetX = playerX;
    this.swoopTargetY = playerY;
    this.facing = playerX < this.x ? Direction.Left : Direction.Right;
  }

  private updateSwooping(): void {
    const speed = this.currentSpeed();
    const dx = this.swoopTargetX - this.x;
    const dy = this.swoopTargetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 12 || this.stateTimerMs >= SWOOP_DURATION_MS) {
      this.state = 'returning';
      this.stateTimerMs = 0;
      return;
    }
    this.vx = (dx / dist) * speed;
    this.vy = (dy / dist) * speed;
    this.facing = dx < 0 ? Direction.Left : Direction.Right;
  }

  private updateReturning(): void {
    const speed = this.currentSpeed();
    const dx = this.originX - this.x;
    const dy = this.originY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 12 || this.stateTimerMs >= RETURN_DURATION_MS) {
      this.state = 'hovering';
      this.stateTimerMs = 0;
      this.swoopCooldownMs = SWOOP_INTERVAL_MS;
      return;
    }
    this.vx = (dx / dist) * speed;
    this.vy = (dy / dist) * speed;
  }

  static get maxHpValue(): number {
    return VAMPIRE_BOSS_HP;
  }

  static get phase2HpThreshold(): number {
    return PHASE2_HP_THRESHOLD;
  }

  static get hitsPerLifesteal(): number {
    return HITS_PER_LIFESTEAL;
  }

  static get lifestealAmount(): number {
    return LIFESTEAL_AMOUNT;
  }

  static get lifestealBlockMs(): number {
    return LIFESTEAL_BLOCK_MS;
  }

  static get phase2SpeedMultiplier(): number {
    return PHASE2_SPEED_MULTIPLIER;
  }

  static get hoverSpeed(): number {
    return HOVER_SPEED;
  }
}
