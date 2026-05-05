import {
  DEFAULT_PLAYER_STATS,
  Direction,
  PlayerStats,
  PHYSICS,
  STAR_DURATION_MS,
  HP_PER_HEART,
} from '../types/GameTypes';

export interface PlayerEvents {
  onDamage?: (hpRemaining: number) => void;
  onDeath?: () => void;
  onLifeLost?: (livesRemaining: number) => void;
  onGameOver?: () => void;
  onCoinCollected?: (totalCoins: number) => void;
  onExtraLife?: (livesRemaining: number) => void;
  onStarStart?: () => void;
  onStarEnd?: () => void;
  onMaxHpIncreased?: (maxHp: number) => void;
}

export class Player {
  hp: number;
  maxHp: number;
  lives: number;
  coins: number;
  facing: Direction = Direction.Right;
  isInvincible: boolean = false;
  isDead: boolean = false;
  jumpsUsed: number = 0;
  isOnGround: boolean = false;
  jumpHoldMs: number = 0;
  isHoldingJump: boolean = false;
  shootCooldownRemaining: number = 0;
  invincibilityRemaining: number = 0;
  starRemaining: number = 0;

  vx: number = 0;
  vy: number = 0;

  private readonly stats: PlayerStats;
  private readonly events: PlayerEvents;
  private readonly maxJumps: number = 2;

  constructor(events: PlayerEvents = {}, stats: PlayerStats = DEFAULT_PLAYER_STATS) {
    this.stats = stats;
    this.events = events;
    this.hp = stats.maxHp;
    this.maxHp = stats.maxHp;
    this.lives = stats.startingLives;
    this.coins = 0;
  }

  /** True while the Star power-up is active (full damage immunity + contact damage). */
  get hasStar(): boolean {
    return this.starRemaining > 0;
  }

  takeDamage(damage: number): boolean {
    if (this.isInvincible || this.isDead || this.hasStar) return false;
    if (damage <= 0) return false;

    this.hp = Math.max(0, this.hp - damage);
    this.events.onDamage?.(this.hp);

    if (this.hp === 0) {
      this.die();
      return true;
    }

    this.isInvincible = true;
    this.invincibilityRemaining = this.stats.invincibilityMs;
    return true;
  }

  private die(): void {
    this.isDead = true;
    this.events.onDeath?.();
    this.lives = Math.max(0, this.lives - 1);
    this.events.onLifeLost?.(this.lives);
    if (this.lives === 0) {
      this.events.onGameOver?.();
    }
  }

  respawn(): void {
    this.hp = this.maxHp;
    this.isDead = false;
    this.isInvincible = true;
    this.invincibilityRemaining = this.stats.invincibilityMs;
    this.vx = 0;
    this.vy = 0;
    this.jumpsUsed = 0;
  }

  collectCoin(): void {
    this.coins += 1;
    this.events.onCoinCollected?.(this.coins);
    if (this.coins > 0 && this.coins % this.stats.coinsForExtraLife === 0) {
      this.lives += 1;
      this.events.onExtraLife?.(this.lives);
    }
  }

  startJump(): boolean {
    if (this.isDead) return false;
    if (this.jumpsUsed >= this.maxJumps) return false;

    this.vy = this.stats.jumpVelocity;
    this.jumpsUsed += 1;
    this.isOnGround = false;
    this.isHoldingJump = true;
    this.jumpHoldMs = 0;
    return true;
  }

  holdJump(deltaMs: number): void {
    if (!this.isHoldingJump) return;
    this.jumpHoldMs += deltaMs;
    if (this.jumpHoldMs <= PHYSICS.jumpHoldMaxMs && this.vy < 0) {
      this.vy -= (PHYSICS.jumpHoldBoost * deltaMs) / 1000;
    } else {
      this.isHoldingJump = false;
    }
  }

  releaseJump(): void {
    this.isHoldingJump = false;
  }

  landOnGround(): void {
    this.isOnGround = true;
    this.jumpsUsed = 0;
    this.vy = 0;
  }

  leaveGround(): void {
    this.isOnGround = false;
  }

  setFacing(dir: Direction): void {
    if (dir === Direction.Left || dir === Direction.Right) {
      this.facing = dir;
    }
  }

  moveHorizontal(dir: Direction | 0, deltaMs: number): void {
    if (this.isDead) return;
    const dt = deltaMs / 1000;
    if (dir === Direction.Left || dir === Direction.Right) {
      this.setFacing(dir);
      this.vx += this.stats.acceleration * dir * dt;
      this.vx = Math.max(-this.stats.moveSpeed, Math.min(this.stats.moveSpeed, this.vx));
    } else {
      const friction = this.stats.friction * dt;
      if (Math.abs(this.vx) <= friction) {
        this.vx = 0;
      } else {
        this.vx -= Math.sign(this.vx) * friction;
      }
    }
  }

  canShoot(): boolean {
    return !this.isDead && this.shootCooldownRemaining <= 0;
  }

  shoot(): boolean {
    if (!this.canShoot()) return false;
    this.shootCooldownRemaining = this.stats.shootCooldownMs;
    return true;
  }

  /** Activates the Star power-up. Refreshes timer if already active. */
  activateStar(durationMs: number = STAR_DURATION_MS): void {
    const wasActive = this.starRemaining > 0;
    this.starRemaining = durationMs;
    if (!wasActive) this.events.onStarStart?.();
  }

  /**
   * Increases maxHp by HP_PER_HEART (one extra heart). Also fully heals.
   * Returns true if the increase was applied.
   */
  addExtraHeart(): boolean {
    this.maxHp += HP_PER_HEART;
    this.hp = this.maxHp;
    this.events.onMaxHpIncreased?.(this.maxHp);
    return true;
  }

  update(deltaMs: number): void {
    if (this.shootCooldownRemaining > 0) {
      this.shootCooldownRemaining = Math.max(0, this.shootCooldownRemaining - deltaMs);
    }
    if (this.invincibilityRemaining > 0) {
      this.invincibilityRemaining = Math.max(0, this.invincibilityRemaining - deltaMs);
      if (this.invincibilityRemaining === 0) {
        this.isInvincible = false;
      }
    }
    if (this.starRemaining > 0) {
      this.starRemaining = Math.max(0, this.starRemaining - deltaMs);
      if (this.starRemaining === 0) {
        this.events.onStarEnd?.();
      }
    }
  }

  getStats(): Readonly<PlayerStats> {
    return this.stats;
  }
}
