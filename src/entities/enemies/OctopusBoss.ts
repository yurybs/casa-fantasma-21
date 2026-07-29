import { Direction } from '../../types/GameTypes';
import { BaseEnemy, EnemyEvents } from './BaseEnemy';

export type OctopusBossPhase = 'phase1' | 'phase2';
export type OctopusBossState = 'idle' | 'striking' | 'inking';

export interface TentacleStrikeInfo {
  /** Index of the tentacle that struck (0-based). */
  index: number;
  /** Angle in radians around the body the tentacle points. */
  angle: number;
  /** Reach in pixels. */
  reach: number;
}

export interface MiniOctopusSpawn {
  x: number;
  y: number;
}

export interface OctopusBossEvents extends EnemyEvents {
  onPhaseChange?: (phase: OctopusBossPhase) => void;
  onTentacleStrike?: (info: TentacleStrikeInfo) => void;
  onInkSplash?: (durationMs: number) => void;
  onSpawnMiniOctopus?: (spawns: MiniOctopusSpawn[]) => void;
}

const OCTOPUS_BOSS_HP = 24;
const PHASE2_HP_THRESHOLD = 12; // ≤50% — grows 2 more tentacles + inks more

const TENTACLES_PHASE1 = 4;
const TENTACLES_PHASE2 = 6;
const TENTACLE_REACH = 64; // 4 tiles

const STRIKE_INTERVAL_MS_PHASE1 = 2600;
const STRIKE_INTERVAL_MS_PHASE2 = 1800;
const STRIKE_DURATION_MS = 450;

const INK_INTERVAL_MS_PHASE1 = 6000;
const INK_INTERVAL_MS_PHASE2 = 4000;
const INK_DURATION_MS = 4000;
const INK_STATE_MS = 500;

/**
 * OctopusBoss (Level 15): stationary boss of the robot castle. Sits at its
 * anchor and lashes out with rotating tentacles; periodically squirts ink
 * that darkens the whole screen for INK_DURATION_MS.
 *
 * - Phase 1 (HP 24→12): 4 tentacles strike in sequence; ink every 6s.
 * - Phase 2 (HP ≤12): grows to 6 tentacles, strikes faster, inks every 4s,
 *   and spawns 2 MiniOctopus once.
 *
 * Pure logic — the scene reads `tentacleCount`, strike events and ink events
 * to render tentacle hitboxes and the dark overlay.
 */
export class OctopusBoss extends BaseEnemy {
  readonly tag: 'normal' = 'normal';
  phase: OctopusBossPhase = 'phase1';
  state: OctopusBossState = 'idle';
  tentacleCount: number = TENTACLES_PHASE1;
  /** Index of the tentacle currently striking (or -1). */
  activeTentacle: number = -1;

  private readonly anchorX: number;
  private readonly anchorY: number;
  private readonly bossEvents: OctopusBossEvents;
  private strikeCooldownMs: number = STRIKE_INTERVAL_MS_PHASE1;
  private inkCooldownMs: number = INK_INTERVAL_MS_PHASE1;
  private stateTimerMs: number = 0;
  private nextTentacle: number = 0;
  private spawnedMinisOnce: boolean = false;

  constructor(anchorX: number, anchorY: number, events: OctopusBossEvents = {}) {
    super({ hp: OCTOPUS_BOSS_HP, damage: 2, speed: 0 }, events);
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.x = anchorX;
    this.y = anchorY;
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
    this.tentacleCount = TENTACLES_PHASE2;
    this.strikeCooldownMs = STRIKE_INTERVAL_MS_PHASE2;
    this.inkCooldownMs = INK_INTERVAL_MS_PHASE2;
    this.bossEvents.onPhaseChange?.('phase2');
    if (!this.spawnedMinisOnce) {
      this.spawnedMinisOnce = true;
      this.bossEvents.onSpawnMiniOctopus?.([
        { x: this.anchorX - 80, y: this.anchorY },
        { x: this.anchorX + 80, y: this.anchorY },
      ]);
    }
  }

  update(deltaMs: number, playerX: number, _playerY: number): void {
    if (this.isDead) {
      this.vx = 0;
      this.vy = 0;
      this.activeTentacle = -1;
      return;
    }

    // Anchored: never moves.
    this.x = this.anchorX;
    this.y = this.anchorY;
    this.vx = 0;
    this.vy = 0;
    this.facing = playerX < this.x ? Direction.Left : Direction.Right;

    this.stateTimerMs += deltaMs;
    this.strikeCooldownMs -= deltaMs;
    this.inkCooldownMs -= deltaMs;

    if (this.state === 'idle') {
      if (this.inkCooldownMs <= 0) {
        this.startInk();
      } else if (this.strikeCooldownMs <= 0) {
        this.startStrike();
      }
    } else if (this.state === 'striking') {
      if (this.stateTimerMs >= STRIKE_DURATION_MS) {
        this.state = 'idle';
        this.stateTimerMs = 0;
        this.activeTentacle = -1;
        this.strikeCooldownMs =
          this.phase === 'phase2' ? STRIKE_INTERVAL_MS_PHASE2 : STRIKE_INTERVAL_MS_PHASE1;
      }
    } else if (this.state === 'inking') {
      if (this.stateTimerMs >= INK_STATE_MS) {
        this.state = 'idle';
        this.stateTimerMs = 0;
        this.inkCooldownMs =
          this.phase === 'phase2' ? INK_INTERVAL_MS_PHASE2 : INK_INTERVAL_MS_PHASE1;
      }
    }
  }

  private startStrike(): void {
    this.state = 'striking';
    this.stateTimerMs = 0;
    const index = this.nextTentacle % this.tentacleCount;
    this.activeTentacle = index;
    this.nextTentacle = (this.nextTentacle + 1) % this.tentacleCount;
    const angle = (index / this.tentacleCount) * Math.PI * 2;
    this.bossEvents.onTentacleStrike?.({ index, angle, reach: TENTACLE_REACH });
  }

  private startInk(): void {
    this.state = 'inking';
    this.stateTimerMs = 0;
    this.bossEvents.onInkSplash?.(INK_DURATION_MS);
  }

  static get maxHpValue(): number {
    return OCTOPUS_BOSS_HP;
  }

  static get phase2HpThreshold(): number {
    return PHASE2_HP_THRESHOLD;
  }

  static get tentaclesPhase1(): number {
    return TENTACLES_PHASE1;
  }

  static get tentaclesPhase2(): number {
    return TENTACLES_PHASE2;
  }

  static get inkDurationMs(): number {
    return INK_DURATION_MS;
  }

  static get tentacleReach(): number {
    return TENTACLE_REACH;
  }
}
