import Phaser from 'phaser';

const px = (
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
): void => {
  g.fillStyle(color, 1);
  g.fillRect(x, y, size, size);
};

const drawFromMatrix = (
  g: Phaser.GameObjects.Graphics,
  matrix: number[][],
  palette: Record<number, number>,
  pxSize: number,
  offsetX = 0,
  offsetY = 0,
): void => {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      const c = matrix[y][x];
      if (c === 0) continue;
      const color = palette[c];
      if (color === undefined) continue;
      px(g, offsetX + x * pxSize, offsetY + y * pxSize, pxSize, color);
    }
  }
};

const PLAYER_MATRIX: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 3, 3, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 4, 4, 4, 4, 0, 0],
  [0, 4, 5, 5, 5, 5, 4, 0],
  [0, 4, 5, 5, 5, 5, 4, 0],
  [0, 4, 4, 5, 5, 4, 4, 0],
  [0, 0, 4, 4, 4, 4, 0, 0],
  [0, 0, 6, 0, 0, 6, 0, 0],
  [0, 0, 6, 0, 0, 6, 0, 0],
  [0, 0, 7, 0, 0, 7, 0, 0],
];

const PLAYER_PALETTE: Record<number, number> = {
  1: 0x222222,
  2: 0xfdd9b5,
  3: 0x2c1f0f,
  4: 0x143a6b,
  5: 0x2469c2,
  6: 0x1a4d8f,
  7: 0x6b3e1d,
};

const SKELETON_MATRIX: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 3, 3, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
];

const SKELETON_PALETTE: Record<number, number> = {
  1: 0x333333,
  2: 0xe8e8d0,
  3: 0x000000,
};

const ZOMBIE_MATRIX: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 3, 3, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 4, 4, 1, 0, 0],
  [0, 1, 4, 4, 4, 4, 1, 0],
  [1, 4, 4, 4, 4, 4, 4, 1],
  [0, 1, 4, 4, 4, 4, 1, 0],
];

const ZOMBIE_PALETTE: Record<number, number> = {
  1: 0x202b1f,
  2: 0x6c8854,
  3: 0xbf2222,
  4: 0x556b3e,
};

const COIN_MATRIX: number[][] = [
  [0, 1, 1, 1, 1, 0],
  [1, 2, 3, 3, 2, 1],
  [1, 3, 2, 2, 3, 1],
  [1, 3, 2, 2, 3, 1],
  [1, 2, 3, 3, 2, 1],
  [0, 1, 1, 1, 1, 0],
];
const COIN_PALETTE: Record<number, number> = {
  1: 0x8a6310,
  2: 0xffd700,
  3: 0xfff7a0,
};

const FLAG_MATRIX: number[][] = [
  [1, 0, 0, 0, 0, 0],
  [1, 2, 2, 2, 0, 0],
  [1, 2, 2, 2, 2, 0],
  [1, 2, 2, 2, 0, 0],
  [1, 2, 2, 0, 0, 0],
  [1, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0],
];
const FLAG_PALETTE: Record<number, number> = {
  1: 0x6b3e1d,
  2: 0xff3344,
};

export class SpriteGenerator {
  static generate(scene: Phaser.Scene): void {
    SpriteGenerator.generatePlayer(scene);
    SpriteGenerator.generateSkeleton(scene);
    SpriteGenerator.generateZombie(scene);
    SpriteGenerator.generateProjectile(scene);
    SpriteGenerator.generateBone(scene);
    SpriteGenerator.generateCoin(scene);
    SpriteGenerator.generateFlag(scene);
    SpriteGenerator.generateTiles(scene);
  }

  private static drawTexture(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number,
    drawFn: (g: Phaser.GameObjects.Graphics) => void,
  ): void {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    drawFn(g);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private static generatePlayer(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = PLAYER_MATRIX[0].length * pxSize;
    const h = PLAYER_MATRIX.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'player', w, h, (g) => {
      drawFromMatrix(g, PLAYER_MATRIX, PLAYER_PALETTE, pxSize);
    });
  }

  private static generateSkeleton(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = SKELETON_MATRIX[0].length * pxSize;
    const h = SKELETON_MATRIX.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'skeleton', w, h, (g) => {
      drawFromMatrix(g, SKELETON_MATRIX, SKELETON_PALETTE, pxSize);
    });
  }

  private static generateZombie(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = ZOMBIE_MATRIX[0].length * pxSize;
    const h = ZOMBIE_MATRIX.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'zombie', w, h, (g) => {
      drawFromMatrix(g, ZOMBIE_MATRIX, ZOMBIE_PALETTE, pxSize);
    });
  }

  private static generateProjectile(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'projectile_foam', 8, 8, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.fillStyle(0xddeeff, 1);
      g.fillCircle(3, 3, 2);
    });
  }

  private static generateBone(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'projectile_bone', 8, 8, (g) => {
      g.fillStyle(0xeeeecc, 1);
      g.fillRect(1, 3, 6, 2);
      g.fillRect(0, 1, 2, 2);
      g.fillRect(0, 5, 2, 2);
      g.fillRect(6, 1, 2, 2);
      g.fillRect(6, 5, 2, 2);
    });
  }

  private static generateCoin(scene: Phaser.Scene): void {
    const pxSize = 2;
    const w = COIN_MATRIX[0].length * pxSize;
    const h = COIN_MATRIX.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'coin', w, h, (g) => {
      drawFromMatrix(g, COIN_MATRIX, COIN_PALETTE, pxSize);
    });
  }

  private static generateFlag(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = FLAG_MATRIX[0].length * pxSize;
    const h = FLAG_MATRIX.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'flag', w, h, (g) => {
      drawFromMatrix(g, FLAG_MATRIX, FLAG_PALETTE, pxSize);
    });
  }

  private static generateTiles(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'tile_ground', 16, 16, (g) => {
      g.fillStyle(0x6b3e1d, 1);
      g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x5b8a52, 1);
      g.fillRect(0, 0, 16, 4);
      g.fillStyle(0x8a5a2b, 1);
      g.fillRect(2, 6, 3, 2);
      g.fillRect(8, 9, 4, 2);
      g.fillRect(11, 13, 3, 2);
      g.fillStyle(0x3d2a13, 1);
      g.fillRect(0, 0, 16, 1);
      g.fillRect(0, 15, 16, 1);
      g.fillRect(0, 0, 1, 16);
      g.fillRect(15, 0, 1, 16);
    });
    SpriteGenerator.drawTexture(scene, 'tile_platform', 16, 16, (g) => {
      g.fillStyle(0x8b5e3c, 1);
      g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x5b8a52, 1);
      g.fillRect(0, 0, 16, 5);
      g.fillStyle(0x3d2a13, 1);
      g.fillRect(0, 0, 16, 1);
      g.fillRect(0, 15, 16, 1);
      g.fillRect(0, 0, 1, 16);
      g.fillRect(15, 0, 1, 16);
    });
  }
}
