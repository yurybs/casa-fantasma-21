import { Direction, EnemyTag } from '../types/GameTypes';

export interface WaterProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Base damage applied to non-ghost enemies. */
  damage: number;
  /** Damage applied to ghost-tagged enemies (2x for water element). */
  damageVsGhost: number;
  alive: boolean;
  ttlMs: number;
}

const PROJECTILE_SPEED = 380;
const PROJECTILE_TTL_MS = 1500;
const WATER_DAMAGE = 1;
const WATER_DAMAGE_VS_GHOST = 2;
const WATER_COOLDOWN_MS = 280;

/**
 * Water-element gun. Same fire rate as FoamGun, but does double damage
 * against enemies tagged 'ghost'. Players obtain it by picking up the
 * water-gun pickup, which persists in save.powerUps.waterGun.
 */
export class WaterGun {
  private cooldownRemaining: number = 0;
  private nextId: number = 1;
  readonly projectiles: WaterProjectile[] = [];

  get cooldownMs(): number {
    return WATER_COOLDOWN_MS;
  }

  canFire(): boolean {
    return this.cooldownRemaining <= 0;
  }

  fire(x: number, y: number, facing: Direction): WaterProjectile | null {
    if (!this.canFire()) return null;
    this.cooldownRemaining = WATER_COOLDOWN_MS;
    const projectile: WaterProjectile = {
      id: this.nextId++,
      x,
      y,
      vx: facing === Direction.Right ? PROJECTILE_SPEED : -PROJECTILE_SPEED,
      vy: 0,
      damage: WATER_DAMAGE,
      damageVsGhost: WATER_DAMAGE_VS_GHOST,
      alive: true,
      ttlMs: PROJECTILE_TTL_MS,
    };
    this.projectiles.push(projectile);
    return projectile;
  }

  /** Returns the damage this projectile should deal to an enemy with the given tag. */
  static damageFor(projectile: WaterProjectile, tag: EnemyTag): number {
    return tag === 'ghost' ? projectile.damageVsGhost : projectile.damage;
  }

  killProjectile(id: number): void {
    const p = this.projectiles.find((proj) => proj.id === id);
    if (p) p.alive = false;
  }

  update(deltaMs: number): void {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - deltaMs);
    }
    const dt = deltaMs / 1000;
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.ttlMs -= deltaMs;
      if (p.ttlMs <= 0) p.alive = false;
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (!this.projectiles[i].alive) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  reset(): void {
    this.projectiles.length = 0;
    this.cooldownRemaining = 0;
  }
}
