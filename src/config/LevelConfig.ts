import { TILE_SIZE } from '../types/GameTypes';

export interface EnemySpawn {
  type: 'skeleton' | 'zombie';
  x: number;
  y: number;
}

export interface CoinSpawn {
  x: number;
  y: number;
}

export interface LevelData {
  id: number;
  name: string;
  widthInTiles: number;
  heightInTiles: number;
  tiles: number[][];
  playerSpawn: { x: number; y: number };
  flagPos: { x: number; y: number };
  enemies: EnemySpawn[];
  coins: CoinSpawn[];
  timeLimit: number;
  backgroundColor: string;
}

const W = 80;
const H = 24;

const buildTiles = (): number[][] => {
  const grid: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      row.push(0);
    }
    grid.push(row);
  }

  for (let x = 0; x < W; x++) {
    grid[H - 1][x] = 1;
    grid[H - 2][x] = 1;
  }

  const pit = (start: number, end: number) => {
    for (let x = start; x <= end; x++) {
      grid[H - 1][x] = 0;
      grid[H - 2][x] = 0;
    }
  };
  pit(20, 22);
  pit(45, 47);
  pit(60, 61);

  const platform = (x1: number, x2: number, y: number) => {
    for (let x = x1; x <= x2; x++) grid[y][x] = 2;
  };

  platform(8, 11, H - 6);
  platform(15, 18, H - 8);
  platform(25, 28, H - 7);
  platform(32, 35, H - 5);
  platform(38, 42, H - 9);
  platform(50, 53, H - 6);
  platform(55, 58, H - 8);
  platform(64, 67, H - 6);
  platform(70, 73, H - 9);

  return grid;
};

export const LEVEL_1: LevelData = {
  id: 1,
  name: 'Floresta Encantada — Início',
  widthInTiles: W,
  heightInTiles: H,
  tiles: buildTiles(),
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
  timeLimit: 400,
  backgroundColor: '#87CEEB',
};
