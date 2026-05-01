import { Direction } from '../types/GameTypes';

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  alive: boolean;
  ttlMs: number;
}

const PROJECTILE_SPEED = 380;
const PROJECTILE_TTL_MS = 1500;
const FOAM_DAMAGE = 1;
const FOAM_COOLDOWN_MS = 300;

export class FoamGun {
  private cooldownRemaining: number = 0;
  private nextId: number = 1;
  readonly projectiles: Projectile[] = [];

  get cooldownMs(): number {
    return FOAM_COOLDOWN_MS;
  }

  canFire(): boolean {
    return this.cooldownRemaining <= 0;
  }

  fire(x: number, y: number, facing: Direction): Projectile | null {
    if (!this.canFire()) return null;
    this.cooldownRemaining = FOAM_COOLDOWN_MS;
    const projectile: Projectile = {
      id: this.nextId++,
      x,
      y,
      vx: facing === Direction.Right ? PROJECTILE_SPEED : -PROJECTILE_SPEED,
      vy: 0,
      damage: FOAM_DAMAGE,
      alive: true,
      ttlMs: PROJECTILE_TTL_MS,
    };
    this.projectiles.push(projectile);
    return projectile;
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
