import { Direction } from '../../types/GameTypes';

export interface EnemyConfig {
  hp: number;
  damage: number;
  speed: number;
  patrolRange?: number;
}

export interface EnemyEvents {
  onDeath?: () => void;
  onDamage?: (hpRemaining: number) => void;
}

export abstract class BaseEnemy {
  hp: number;
  readonly maxHp: number;
  readonly damage: number;
  readonly speed: number;
  facing: Direction = Direction.Left;
  isDead: boolean = false;
  vx: number = 0;
  vy: number = 0;
  x: number = 0;
  y: number = 0;
  isOnGround: boolean = false;

  protected readonly events: EnemyEvents;

  constructor(config: EnemyConfig, events: EnemyEvents = {}) {
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.damage = config.damage;
    this.speed = config.speed;
    this.events = events;
  }

  takeDamage(damage: number): boolean {
    if (this.isDead || damage <= 0) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.events.onDamage?.(this.hp);
    if (this.hp === 0) {
      this.isDead = true;
      this.events.onDeath?.();
      return true;
    }
    return false;
  }

  flipDirection(): void {
    this.facing = this.facing === Direction.Left ? Direction.Right : Direction.Left;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  abstract update(deltaMs: number, playerX: number, playerY: number): void;
}
