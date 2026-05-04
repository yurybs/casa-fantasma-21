import { TILE_SIZE, EnemyKind } from '../types/GameTypes';

export interface EnemySpawn {
  type: EnemyKind;
  x: number;
  y: number;
}

export interface CoinSpawn {
  x: number;
  y: number;
}

export interface CheckpointSpawn {
  x: number;
  y: number;
}

export type PowerUpKind = 'water_gun' | 'star' | 'extra_heart';

export interface PowerUpSpawn {
  type: PowerUpKind;
  x: number;
  y: number;
}

export type BossKind = 'ghost' | 'clown' | 'scarecrow';

export interface BossSpawn {
  type: BossKind;
  x: number;
  y: number;
}

/** Tile theme used by GameScene to pick the correct sprite keys. */
export type LevelTheme = 'forest' | 'cave';

export interface LevelData {
  id: number;
  name: string;
  widthInTiles: number;
  heightInTiles: number;
  tiles: number[][];
  playerSpawn: { x: number; y: number };
  flagPos: { x: number; y: number } | null;
  enemies: EnemySpawn[];
  coins: CoinSpawn[];
  checkpoints: CheckpointSpawn[];
  powerUps: PowerUpSpawn[];
  boss: BossSpawn | null;
  timeLimit: number;
  backgroundColor: string;
  theme: LevelTheme;
  /** World index (1-based) — 1 = Floresta, 2 = Caverna. */
  world: number;
}

const buildEmptyGrid = (w: number, h: number): number[][] => {
  const grid: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = new Array(w).fill(0);
    grid.push(row);
  }
  return grid;
};

const fillGround = (grid: number[][], rows: number = 2): void => {
  const h = grid.length;
  const w = grid[0].length;
  for (let y = h - rows; y < h; y++) {
    for (let x = 0; x < w; x++) {
      grid[y][x] = 1;
    }
  }
};

const carvePit = (grid: number[][], start: number, end: number): void => {
  const h = grid.length;
  for (let x = start; x <= end; x++) {
    grid[h - 1][x] = 0;
    grid[h - 2][x] = 0;
  }
};

const placePlatform = (grid: number[][], x1: number, x2: number, y: number): void => {
  for (let x = x1; x <= x2; x++) grid[y][x] = 2;
};

const placeWall = (grid: number[][], x: number, y1: number, y2: number): void => {
  for (let y = y1; y <= y2; y++) grid[y][x] = 1;
};

// =============================================================================
// LEVEL 1 — Floresta Encantada Início (Sprint 1, polished in Sprint 2)
// =============================================================================
const buildLevel1 = (): LevelData => {
  const W = 80;
  const H = 24;
  const tiles = buildEmptyGrid(W, H);
  fillGround(tiles, 2);

  carvePit(tiles, 20, 22);
  carvePit(tiles, 45, 47);
  carvePit(tiles, 60, 61);

  placePlatform(tiles, 8, 11, H - 6);
  placePlatform(tiles, 15, 18, H - 8);
  placePlatform(tiles, 25, 28, H - 7);
  placePlatform(tiles, 32, 35, H - 5);
  placePlatform(tiles, 38, 42, H - 9);
  placePlatform(tiles, 50, 53, H - 6);
  placePlatform(tiles, 55, 58, H - 8);
  placePlatform(tiles, 64, 67, H - 6);
  placePlatform(tiles, 70, 73, H - 9);

  return {
    id: 1,
    name: 'Floresta Encantada — Início',
    widthInTiles: W,
    heightInTiles: H,
    tiles,
    playerSpawn: { x: 2 * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    flagPos: { x: (W - 3) * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    enemies: [
      { type: 'skeleton', x: 12 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'zombie', x: 28 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'skeleton', x: 40 * TILE_SIZE, y: (H - 11) * TILE_SIZE },
      { type: 'zombie', x: 52 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'skeleton', x: 66 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'zombie', x: 72 * TILE_SIZE, y: (H - 11) * TILE_SIZE },
      { type: 'skeleton', x: 76 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
    ],
    coins: [
      ...[9, 10, 11].map((x) => ({ x: x * TILE_SIZE, y: (H - 7) * TILE_SIZE })),
      ...[16, 17].map((x) => ({ x: x * TILE_SIZE, y: (H - 9) * TILE_SIZE })),
      ...[26, 27].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
      ...[33, 34].map((x) => ({ x: x * TILE_SIZE, y: (H - 6) * TILE_SIZE })),
      ...[39, 40, 41].map((x) => ({ x: x * TILE_SIZE, y: (H - 10) * TILE_SIZE })),
      ...[51, 52].map((x) => ({ x: x * TILE_SIZE, y: (H - 7) * TILE_SIZE })),
      ...[56, 57].map((x) => ({ x: x * TILE_SIZE, y: (H - 9) * TILE_SIZE })),
      ...[65, 66].map((x) => ({ x: x * TILE_SIZE, y: (H - 7) * TILE_SIZE })),
      ...[71, 72, 73].map((x) => ({ x: x * TILE_SIZE, y: (H - 10) * TILE_SIZE })),
    ],
    checkpoints: [],
    powerUps: [],
    boss: null,
    timeLimit: 400,
    backgroundColor: '#87CEEB',
    theme: 'forest',
    world: 1,
  };
};

// =============================================================================
// LEVEL 2 — Floresta Encantada — Arena do Fantasma (Sprint 3 boss)
// Smaller closed arena. WaterGun pickup, then GhostBoss fight.
// =============================================================================
const buildLevel2 = (): LevelData => {
  const W = 30;
  const H = 24;
  const tiles = buildEmptyGrid(W, H);
  fillGround(tiles, 2);

  // Closed arena walls
  placeWall(tiles, 0, 0, H - 1);
  placeWall(tiles, W - 1, 0, H - 1);

  // Two raised platforms for vertical play
  placePlatform(tiles, 4, 8, H - 7);
  placePlatform(tiles, 14, 17, H - 10);
  placePlatform(tiles, 21, 25, H - 7);

  return {
    id: 2,
    name: 'Floresta Encantada — Arena do Fantasma',
    widthInTiles: W,
    heightInTiles: H,
    tiles,
    playerSpawn: { x: 2 * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    flagPos: null,
    enemies: [],
    coins: [
      ...[5, 6, 7].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
      ...[15, 16].map((x) => ({ x: x * TILE_SIZE, y: (H - 11) * TILE_SIZE })),
      ...[22, 23, 24].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
    ],
    checkpoints: [],
    powerUps: [{ type: 'water_gun', x: 15 * TILE_SIZE, y: (H - 12) * TILE_SIZE }],
    boss: { type: 'ghost', x: 22 * TILE_SIZE, y: 6 * TILE_SIZE },
    timeLimit: 200,
    backgroundColor: '#3a2b50',
    theme: 'forest',
    world: 1,
  };
};

// =============================================================================
// LEVEL 3 — Floresta Encantada — Caminho dos Espíritos (Sprint 3)
// Longer level with SpiderGhost descents and a mid-level checkpoint.
// =============================================================================
const buildLevel3 = (): LevelData => {
  const W = 70;
  const H = 24;
  const tiles = buildEmptyGrid(W, H);
  fillGround(tiles, 2);

  carvePit(tiles, 18, 20);
  carvePit(tiles, 42, 44);
  carvePit(tiles, 56, 57);

  placePlatform(tiles, 6, 9, H - 7);
  placePlatform(tiles, 13, 16, H - 5);
  placePlatform(tiles, 22, 25, H - 8);
  placePlatform(tiles, 30, 33, H - 6);
  placePlatform(tiles, 36, 40, H - 9);
  placePlatform(tiles, 47, 50, H - 7);
  placePlatform(tiles, 60, 63, H - 8);

  return {
    id: 3,
    name: 'Floresta Encantada — Caminho dos Espíritos',
    widthInTiles: W,
    heightInTiles: H,
    tiles,
    playerSpawn: { x: 2 * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    flagPos: { x: (W - 3) * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    enemies: [
      { type: 'zombie', x: 10 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'spider_ghost', x: 14 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'skeleton', x: 24 * TILE_SIZE, y: (H - 9) * TILE_SIZE },
      { type: 'spider_ghost', x: 28 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'zombie', x: 34 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'spider_ghost', x: 46 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'skeleton', x: 50 * TILE_SIZE, y: (H - 8) * TILE_SIZE },
      { type: 'spider_ghost', x: 60 * TILE_SIZE, y: 4 * TILE_SIZE },
    ],
    coins: [
      ...[7, 8, 9].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
      ...[14, 15].map((x) => ({ x: x * TILE_SIZE, y: (H - 6) * TILE_SIZE })),
      ...[23, 24].map((x) => ({ x: x * TILE_SIZE, y: (H - 9) * TILE_SIZE })),
      ...[31, 32].map((x) => ({ x: x * TILE_SIZE, y: (H - 7) * TILE_SIZE })),
      ...[37, 38, 39].map((x) => ({ x: x * TILE_SIZE, y: (H - 10) * TILE_SIZE })),
      ...[48, 49].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
      ...[61, 62].map((x) => ({ x: x * TILE_SIZE, y: (H - 9) * TILE_SIZE })),
    ],
    checkpoints: [{ x: 35 * TILE_SIZE, y: (H - 4) * TILE_SIZE }],
    powerUps: [],
    boss: null,
    timeLimit: 400,
    backgroundColor: '#1f2c4a',
    theme: 'forest',
    world: 1,
  };
};

// =============================================================================
// LEVEL 4 — Caverna Assombrada — Arena do Palhaço (Sprint 4 boss)
// Closed cave arena with platforms; ClownBoss + screen-confusion in Phase 2.
// Star pickup helps survive juggling-ball patterns.
// =============================================================================
const buildLevel4 = (): LevelData => {
  const W = 32;
  const H = 24;
  const tiles = buildEmptyGrid(W, H);
  fillGround(tiles, 2);
  placeWall(tiles, 0, 0, H - 1);
  placeWall(tiles, W - 1, 0, H - 1);

  placePlatform(tiles, 4, 8, H - 7);
  placePlatform(tiles, 13, 18, H - 11);
  placePlatform(tiles, 23, 27, H - 7);

  return {
    id: 4,
    name: 'Caverna Assombrada — Arena do Palhaço',
    widthInTiles: W,
    heightInTiles: H,
    tiles,
    playerSpawn: { x: 2 * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    flagPos: null,
    enemies: [],
    coins: [
      ...[5, 6, 7].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
      ...[14, 15, 16, 17].map((x) => ({ x: x * TILE_SIZE, y: (H - 12) * TILE_SIZE })),
      ...[24, 25, 26].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
    ],
    checkpoints: [],
    powerUps: [{ type: 'star', x: 15 * TILE_SIZE, y: (H - 13) * TILE_SIZE }],
    boss: { type: 'clown', x: 22 * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    timeLimit: 240,
    backgroundColor: '#1a0f24',
    theme: 'cave',
    world: 2,
  };
};

// =============================================================================
// LEVEL 5 — Caverna Assombrada — Galeria das Tochas (Sprint 4 normal)
// Long cave with FireGhost patrols + a mid-level checkpoint + ExtraHeart.
// =============================================================================
const buildLevel5 = (): LevelData => {
  const W = 70;
  const H = 24;
  const tiles = buildEmptyGrid(W, H);
  fillGround(tiles, 2);

  carvePit(tiles, 16, 18);
  carvePit(tiles, 38, 40);
  carvePit(tiles, 54, 55);

  placePlatform(tiles, 5, 9, H - 7);
  placePlatform(tiles, 12, 15, H - 5);
  placePlatform(tiles, 21, 25, H - 8);
  placePlatform(tiles, 30, 34, H - 6);
  placePlatform(tiles, 35, 39, H - 10);
  placePlatform(tiles, 45, 49, H - 7);
  placePlatform(tiles, 58, 62, H - 9);

  return {
    id: 5,
    name: 'Caverna Assombrada — Galeria das Tochas',
    widthInTiles: W,
    heightInTiles: H,
    tiles,
    playerSpawn: { x: 2 * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    flagPos: { x: (W - 3) * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    enemies: [
      { type: 'fire_ghost', x: 9 * TILE_SIZE, y: (H - 11) * TILE_SIZE },
      { type: 'zombie', x: 14 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'fire_ghost', x: 25 * TILE_SIZE, y: (H - 12) * TILE_SIZE },
      { type: 'spider_ghost', x: 28 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'zombie', x: 33 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'fire_ghost', x: 47 * TILE_SIZE, y: (H - 11) * TILE_SIZE },
      { type: 'spider_ghost', x: 50 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'zombie', x: 60 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
    ],
    coins: [
      ...[6, 7, 8].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
      ...[13, 14].map((x) => ({ x: x * TILE_SIZE, y: (H - 6) * TILE_SIZE })),
      ...[22, 23, 24].map((x) => ({ x: x * TILE_SIZE, y: (H - 9) * TILE_SIZE })),
      ...[36, 37, 38].map((x) => ({ x: x * TILE_SIZE, y: (H - 11) * TILE_SIZE })),
      ...[46, 47, 48].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
      ...[59, 60, 61].map((x) => ({ x: x * TILE_SIZE, y: (H - 10) * TILE_SIZE })),
    ],
    checkpoints: [{ x: 33 * TILE_SIZE, y: (H - 4) * TILE_SIZE }],
    powerUps: [{ type: 'extra_heart', x: 38 * TILE_SIZE, y: (H - 12) * TILE_SIZE }],
    boss: null,
    timeLimit: 400,
    backgroundColor: '#0e0820',
    theme: 'cave',
    world: 2,
  };
};

// =============================================================================
// LEVEL 6 — Caverna Assombrada — Arena do Espantalho (Sprint 4 boss)
// Open arena, ScarecrowBoss with arm extension + crow waves; star refresh
// pickup mid-fight.
// =============================================================================
const buildLevel6 = (): LevelData => {
  const W = 36;
  const H = 24;
  const tiles = buildEmptyGrid(W, H);
  fillGround(tiles, 2);
  placeWall(tiles, 0, 0, H - 1);
  placeWall(tiles, W - 1, 0, H - 1);

  placePlatform(tiles, 4, 9, H - 7);
  placePlatform(tiles, 14, 21, H - 11);
  placePlatform(tiles, 26, 31, H - 7);

  return {
    id: 6,
    name: 'Caverna Assombrada — Arena do Espantalho',
    widthInTiles: W,
    heightInTiles: H,
    tiles,
    playerSpawn: { x: 2 * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    flagPos: null,
    enemies: [],
    coins: [
      ...[5, 6, 7].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
      ...[15, 16, 17, 18].map((x) => ({ x: x * TILE_SIZE, y: (H - 12) * TILE_SIZE })),
      ...[27, 28, 29].map((x) => ({ x: x * TILE_SIZE, y: (H - 8) * TILE_SIZE })),
    ],
    checkpoints: [],
    powerUps: [{ type: 'star', x: 17 * TILE_SIZE, y: (H - 13) * TILE_SIZE }],
    boss: { type: 'scarecrow', x: 18 * TILE_SIZE, y: (H - 4) * TILE_SIZE },
    timeLimit: 280,
    backgroundColor: '#241430',
    theme: 'cave',
    world: 2,
  };
};

export const LEVEL_1: LevelData = buildLevel1();
export const LEVEL_2: LevelData = buildLevel2();
export const LEVEL_3: LevelData = buildLevel3();
export const LEVEL_4: LevelData = buildLevel4();
export const LEVEL_5: LevelData = buildLevel5();
export const LEVEL_6: LevelData = buildLevel6();

export const LEVELS: LevelData[] = [
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
  LEVEL_6,
];

export function getLevelByIndex(levelIndex: number): LevelData {
  return LEVELS[levelIndex - 1] ?? LEVEL_1;
}
