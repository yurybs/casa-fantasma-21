export const TILE_SIZE = 16;
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 48;
export const ENEMY_SIZE = 32;
export const PROJECTILE_SIZE = 8;

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export interface Vec2 {
  x: number;
  y: number;
}

export interface SaveData {
  currentLevel: number;
  lives: number;
  coins: number;
  levelsCompleted: boolean[];
  highScore: number;
}

export const SAVE_KEY = 'toy-blaster-kid:save';

export interface PlayerStats {
  maxHp: number;
  startingLives: number;
  coinsForExtraLife: number;
  invincibilityMs: number;
  jumpVelocity: number;
  moveSpeed: number;
  acceleration: number;
  friction: number;
  shootCooldownMs: number;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  maxHp: 6,
  startingLives: 3,
  coinsForExtraLife: 100,
  invincibilityMs: 1500,
  jumpVelocity: -420,
  moveSpeed: 180,
  acceleration: 1200,
  friction: 1400,
  shootCooldownMs: 300,
};

export const PHYSICS = {
  gravity: 980,
  terminalVelocity: 600,
  jumpHoldBoost: 220,
  jumpHoldMaxMs: 200,
};

export enum Direction {
  Left = -1,
  Right = 1,
}

export enum EntityType {
  Player = 'player',
  Skeleton = 'skeleton',
  Zombie = 'zombie',
  Projectile = 'projectile',
  Coin = 'coin',
  Flag = 'flag',
}
