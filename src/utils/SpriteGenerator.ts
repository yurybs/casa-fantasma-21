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

// 1=outline 2=skin 3=eye 4=hair 5=shirt 6=shirt_dark 7=pants 8=shoe 9=gun_body 10=gun_tip
const PLAYER_IDLE: number[][] = [
  [0, 0, 0, 4, 4, 4, 4, 0, 0, 0],
  [0, 0, 4, 4, 4, 4, 4, 4, 0, 0],
  [0, 0, 4, 2, 2, 2, 2, 4, 0, 0],
  [0, 0, 2, 2, 3, 2, 3, 2, 0, 0],
  [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],
  [0, 0, 0, 5, 5, 5, 5, 0, 0, 0],
  [0, 5, 5, 6, 6, 6, 6, 5, 5, 9],
  [0, 5, 6, 6, 6, 6, 6, 5, 9, 10],
  [0, 5, 6, 6, 6, 6, 6, 5, 0, 0],
  [0, 0, 5, 5, 5, 5, 5, 0, 0, 0],
  [0, 0, 7, 7, 0, 7, 7, 0, 0, 0],
  [0, 0, 7, 7, 0, 7, 7, 0, 0, 0],
  [0, 0, 8, 8, 0, 8, 8, 0, 0, 0],
];

const PLAYER_RUN: number[][] = [
  [0, 0, 0, 4, 4, 4, 4, 0, 0, 0],
  [0, 0, 4, 4, 4, 4, 4, 4, 0, 0],
  [0, 0, 4, 2, 2, 2, 2, 4, 0, 0],
  [0, 0, 2, 2, 3, 2, 3, 2, 0, 0],
  [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],
  [0, 0, 0, 5, 5, 5, 5, 0, 0, 0],
  [0, 5, 5, 6, 6, 6, 6, 5, 5, 9],
  [0, 5, 6, 6, 6, 6, 6, 5, 9, 10],
  [0, 5, 6, 6, 6, 6, 6, 5, 0, 0],
  [0, 0, 5, 5, 5, 5, 5, 0, 0, 0],
  [0, 7, 7, 0, 0, 0, 7, 7, 0, 0],
  [0, 7, 0, 0, 0, 0, 0, 7, 0, 0],
  [0, 8, 8, 0, 0, 0, 8, 8, 0, 0],
];

const PLAYER_JUMP: number[][] = [
  [0, 0, 0, 4, 4, 4, 4, 0, 0, 0],
  [0, 0, 4, 4, 4, 4, 4, 4, 0, 0],
  [0, 0, 4, 2, 2, 2, 2, 4, 0, 0],
  [0, 0, 2, 2, 3, 2, 3, 2, 0, 0],
  [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],
  [0, 0, 0, 5, 5, 5, 5, 0, 0, 0],
  [0, 5, 5, 6, 6, 6, 6, 5, 5, 9],
  [0, 5, 6, 6, 6, 6, 6, 5, 9, 10],
  [0, 5, 6, 6, 6, 6, 6, 5, 0, 0],
  [0, 0, 5, 5, 5, 5, 5, 0, 0, 0],
  [0, 0, 0, 7, 7, 7, 0, 0, 0, 0],
  [0, 0, 7, 7, 0, 7, 7, 0, 0, 0],
  [0, 0, 8, 0, 0, 0, 8, 0, 0, 0],
];

const PLAYER_PALETTE: Record<number, number> = {
  1: 0x222222,
  2: 0xfdd9b5,
  3: 0x2c1f0f,
  4: 0x8b4513,
  5: 0x2469c2,
  6: 0x143a6b,
  7: 0x444444,
  8: 0x222222,
  9: 0xff8800,
  10: 0xffff00,
};

const SKELETON_IDLE: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 3, 3, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
];
const SKELETON_WALK: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 3, 3, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 0, 2, 2, 2, 2, 0, 1],
];
const SKELETON_PALETTE: Record<number, number> = {
  1: 0x333333,
  2: 0xe8e8d0,
  3: 0x000000,
};

const ZOMBIE_IDLE: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 3, 3, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 4, 4, 1, 0, 0],
  [0, 1, 4, 4, 4, 4, 1, 0],
  [1, 4, 4, 4, 4, 4, 4, 1],
  [0, 1, 4, 4, 4, 4, 1, 0],
];
const ZOMBIE_WALK: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 3, 3, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 4, 4, 4, 4, 1, 0],
  [1, 4, 4, 4, 4, 4, 4, 1],
  [0, 1, 4, 4, 4, 4, 1, 0],
  [1, 4, 0, 4, 4, 0, 4, 1],
];
const ZOMBIE_PALETTE: Record<number, number> = {
  1: 0x202b1f,
  2: 0x6c8854,
  3: 0xbf2222,
  4: 0x556b3e,
};

const COIN_FRAMES: number[][][] = [
  [
    [0, 1, 1, 1, 1, 0],
    [1, 2, 3, 3, 2, 1],
    [1, 3, 2, 2, 3, 1],
    [1, 3, 2, 2, 3, 1],
    [1, 2, 3, 3, 2, 1],
    [0, 1, 1, 1, 1, 0],
  ],
  [
    [0, 0, 1, 1, 0, 0],
    [0, 1, 3, 3, 1, 0],
    [0, 1, 2, 2, 1, 0],
    [0, 1, 2, 2, 1, 0],
    [0, 1, 3, 3, 1, 0],
    [0, 0, 1, 1, 0, 0],
  ],
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

const CHECKPOINT_FLAG_PALETTE: Record<number, number> = {
  1: 0x6b3e1d,
  2: 0x55aaff,
};

// 1=outline 2=body 3=eye
const GHOST_BOSS_IDLE: number[][] = [
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 2, 3, 2, 2, 3, 2, 2, 1, 0],
  [0, 1, 2, 2, 3, 2, 2, 3, 2, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 2, 2, 1, 1, 2, 2, 1, 2, 1],
  [1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1],
];
const GHOST_BOSS_PHASE2: number[][] = [
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 3, 3, 2, 2, 3, 3, 2, 1, 0],
  [0, 1, 2, 3, 3, 2, 2, 3, 3, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 2, 2, 1, 1, 2, 2, 1, 2, 1],
  [1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1],
];
const GHOST_BOSS_PALETTE: Record<number, number> = {
  1: 0x222244,
  2: 0xddddff,
  3: 0x441144,
};
const GHOST_BOSS_PHASE2_PALETTE: Record<number, number> = {
  1: 0x441122,
  2: 0xffaadd,
  3: 0xff2266,
};

const MINI_GHOST_FRAME: number[][] = [
  [0, 1, 1, 1, 1, 0],
  [1, 2, 2, 2, 2, 1],
  [1, 2, 3, 2, 3, 1],
  [1, 2, 2, 2, 2, 1],
  [1, 2, 2, 2, 2, 1],
  [1, 1, 0, 1, 0, 1],
];
const MINI_GHOST_PALETTE: Record<number, number> = {
  1: 0x222244,
  2: 0xccccff,
  3: 0x441144,
};

// Spider ghost: skull-spider hybrid. 1=outline 2=body 3=eye 4=leg
const SPIDER_GHOST_FRAME: number[][] = [
  [4, 0, 4, 0, 0, 0, 0, 4, 0, 4],
  [0, 4, 0, 1, 1, 1, 1, 0, 4, 0],
  [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
  [0, 0, 1, 2, 3, 3, 2, 1, 0, 0],
  [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
];
const SPIDER_GHOST_PALETTE: Record<number, number> = {
  1: 0x111133,
  2: 0xbbbbdd,
  3: 0xff3366,
  4: 0x222244,
};

// Water-gun pickup icon
const WATER_GUN_FRAME: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 4, 4, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];
const WATER_GUN_PALETTE: Record<number, number> = {
  1: 0x113366,
  2: 0x66bbff,
  3: 0xaaddff,
  4: 0xffffff,
};

export class SpriteGenerator {
  static generate(scene: Phaser.Scene): void {
    SpriteGenerator.generatePlayerFrames(scene);
    SpriteGenerator.generateSkeletonFrames(scene);
    SpriteGenerator.generateZombieFrames(scene);
    SpriteGenerator.generateProjectile(scene);
    SpriteGenerator.generateBone(scene);
    SpriteGenerator.generateCoinFrames(scene);
    SpriteGenerator.generateFlag(scene);
    SpriteGenerator.generateCheckpointFlag(scene);
    SpriteGenerator.generateTiles(scene);
    SpriteGenerator.generateBackgroundDecor(scene);
    SpriteGenerator.generateGhostBossFrames(scene);
    SpriteGenerator.generateMiniGhost(scene);
    SpriteGenerator.generateSpiderGhost(scene);
    SpriteGenerator.generateWaterGun(scene);
    SpriteGenerator.generateWaterProjectile(scene);
    SpriteGenerator.generateCaveTiles(scene);
    SpriteGenerator.generateClownBossFrames(scene);
    SpriteGenerator.generateScarecrowBossFrames(scene);
    SpriteGenerator.generateMiniClown(scene);
    SpriteGenerator.generateMiniScarecrow(scene);
    SpriteGenerator.generateFireGhost(scene);
    SpriteGenerator.generateCrow(scene);
    SpriteGenerator.generateJuggleBall(scene);
    SpriteGenerator.generateFireTrail(scene);
    SpriteGenerator.generateStarPickup(scene);
    SpriteGenerator.generateExtraHeartPickup(scene);
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

  private static generatePlayerFrames(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = PLAYER_IDLE[0].length * pxSize;
    const h = PLAYER_IDLE.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'player', w, h, (g) =>
      drawFromMatrix(g, PLAYER_IDLE, PLAYER_PALETTE, pxSize),
    );
    SpriteGenerator.drawTexture(scene, 'player_run', w, h, (g) =>
      drawFromMatrix(g, PLAYER_RUN, PLAYER_PALETTE, pxSize),
    );
    SpriteGenerator.drawTexture(scene, 'player_jump', w, h, (g) =>
      drawFromMatrix(g, PLAYER_JUMP, PLAYER_PALETTE, pxSize),
    );
  }

  private static generateSkeletonFrames(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = SKELETON_IDLE[0].length * pxSize;
    const h = SKELETON_IDLE.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'skeleton', w, h, (g) =>
      drawFromMatrix(g, SKELETON_IDLE, SKELETON_PALETTE, pxSize),
    );
    SpriteGenerator.drawTexture(scene, 'skeleton_walk', w, h, (g) =>
      drawFromMatrix(g, SKELETON_WALK, SKELETON_PALETTE, pxSize),
    );
  }

  private static generateZombieFrames(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = ZOMBIE_IDLE[0].length * pxSize;
    const h = ZOMBIE_IDLE.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'zombie', w, h, (g) =>
      drawFromMatrix(g, ZOMBIE_IDLE, ZOMBIE_PALETTE, pxSize),
    );
    SpriteGenerator.drawTexture(scene, 'zombie_walk', w, h, (g) =>
      drawFromMatrix(g, ZOMBIE_WALK, ZOMBIE_PALETTE, pxSize),
    );
  }

  private static generateProjectile(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'projectile_foam', 10, 10, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(5, 5, 5);
      g.fillStyle(0xddeeff, 1);
      g.fillCircle(4, 4, 3);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(3, 3, 1);
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

  private static generateCoinFrames(scene: Phaser.Scene): void {
    const pxSize = 2;
    COIN_FRAMES.forEach((frame, idx) => {
      const w = frame[0].length * pxSize;
      const h = frame.length * pxSize;
      const key = idx === 0 ? 'coin' : `coin_${idx}`;
      SpriteGenerator.drawTexture(scene, key, w, h, (g) =>
        drawFromMatrix(g, frame, COIN_PALETTE, pxSize),
      );
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
      g.fillStyle(0x7ab266, 1);
      g.fillRect(0, 4, 16, 1);
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
      g.fillStyle(0x7ab266, 1);
      g.fillRect(0, 5, 16, 1);
      g.fillStyle(0x6b3e1d, 1);
      g.fillRect(2, 8, 3, 1);
      g.fillRect(8, 11, 4, 1);
      g.fillStyle(0x3d2a13, 1);
      g.fillRect(0, 0, 16, 1);
      g.fillRect(0, 15, 16, 1);
      g.fillRect(0, 0, 1, 16);
      g.fillRect(15, 0, 1, 16);
    });
  }

  private static generateCheckpointFlag(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = FLAG_MATRIX[0].length * pxSize;
    const h = FLAG_MATRIX.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'checkpoint_flag', w, h, (g) => {
      drawFromMatrix(g, FLAG_MATRIX, CHECKPOINT_FLAG_PALETTE, pxSize);
    });
    SpriteGenerator.drawTexture(scene, 'checkpoint_flag_active', w, h, (g) => {
      drawFromMatrix(g, FLAG_MATRIX, { 1: 0x6b3e1d, 2: 0x66ff66 }, pxSize);
    });
  }

  private static generateGhostBossFrames(scene: Phaser.Scene): void {
    const pxSize = 5;
    const w = GHOST_BOSS_IDLE[0].length * pxSize;
    const h = GHOST_BOSS_IDLE.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'ghost_boss', w, h, (g) =>
      drawFromMatrix(g, GHOST_BOSS_IDLE, GHOST_BOSS_PALETTE, pxSize),
    );
    SpriteGenerator.drawTexture(scene, 'ghost_boss_phase2', w, h, (g) =>
      drawFromMatrix(g, GHOST_BOSS_PHASE2, GHOST_BOSS_PHASE2_PALETTE, pxSize),
    );
  }

  private static generateMiniGhost(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = MINI_GHOST_FRAME[0].length * pxSize;
    const h = MINI_GHOST_FRAME.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'mini_ghost', w, h, (g) =>
      drawFromMatrix(g, MINI_GHOST_FRAME, MINI_GHOST_PALETTE, pxSize),
    );
  }

  private static generateSpiderGhost(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = SPIDER_GHOST_FRAME[0].length * pxSize;
    const h = SPIDER_GHOST_FRAME.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'spider_ghost', w, h, (g) =>
      drawFromMatrix(g, SPIDER_GHOST_FRAME, SPIDER_GHOST_PALETTE, pxSize),
    );
  }

  private static generateWaterGun(scene: Phaser.Scene): void {
    const pxSize = 4;
    const w = WATER_GUN_FRAME[0].length * pxSize;
    const h = WATER_GUN_FRAME.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'water_gun_pickup', w, h, (g) =>
      drawFromMatrix(g, WATER_GUN_FRAME, WATER_GUN_PALETTE, pxSize),
    );
  }

  private static generateWaterProjectile(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'projectile_water', 12, 12, (g) => {
      g.fillStyle(0x66bbff, 1);
      g.fillCircle(6, 6, 6);
      g.fillStyle(0xaaddff, 1);
      g.fillCircle(5, 5, 4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 1.5);
    });
  }

  private static generateBackgroundDecor(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'cloud', 64, 24, (g) => {
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(16, 14, 12);
      g.fillCircle(28, 10, 14);
      g.fillCircle(44, 12, 12);
      g.fillCircle(54, 16, 8);
    });
    SpriteGenerator.drawTexture(scene, 'bush', 32, 16, (g) => {
      g.fillStyle(0x3a6e34, 1);
      g.fillCircle(8, 10, 7);
      g.fillCircle(16, 8, 8);
      g.fillCircle(24, 10, 7);
      g.fillStyle(0x5b8a52, 1);
      g.fillCircle(7, 9, 4);
      g.fillCircle(17, 7, 5);
      g.fillCircle(23, 9, 4);
    });
    SpriteGenerator.drawTexture(scene, 'tree', 32, 56, (g) => {
      g.fillStyle(0x6b3e1d, 1);
      g.fillRect(13, 30, 6, 26);
      g.fillStyle(0x3a6e34, 1);
      g.fillCircle(16, 16, 14);
      g.fillCircle(8, 22, 8);
      g.fillCircle(24, 22, 8);
      g.fillStyle(0x5b8a52, 1);
      g.fillCircle(13, 12, 5);
      g.fillCircle(20, 16, 4);
    });
  }

  // ===== Sprint 4 — Mundo 2 (Caverna Assombrada) =====

  private static generateCaveTiles(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'tile_cave_ground', 16, 16, (g) => {
      g.fillStyle(0x3a3247, 1);
      g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x57476b, 1);
      g.fillRect(0, 0, 16, 4);
      g.fillStyle(0x6e588a, 1);
      g.fillRect(0, 4, 16, 1);
      g.fillStyle(0x261c33, 1);
      g.fillRect(2, 6, 3, 2);
      g.fillRect(8, 9, 4, 2);
      g.fillRect(11, 13, 3, 2);
      g.fillStyle(0x14101c, 1);
      g.fillRect(0, 0, 16, 1);
      g.fillRect(0, 15, 16, 1);
      g.fillRect(0, 0, 1, 16);
      g.fillRect(15, 0, 1, 16);
    });
    SpriteGenerator.drawTexture(scene, 'tile_cave_platform', 16, 16, (g) => {
      g.fillStyle(0x52406e, 1);
      g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x7a5e9f, 1);
      g.fillRect(0, 0, 16, 5);
      g.fillStyle(0x9a7dc6, 1);
      g.fillRect(0, 5, 16, 1);
      g.fillStyle(0x2a1f3d, 1);
      g.fillRect(2, 8, 3, 1);
      g.fillRect(8, 11, 4, 1);
      g.fillStyle(0x14101c, 1);
      g.fillRect(0, 0, 16, 1);
      g.fillRect(0, 15, 16, 1);
      g.fillRect(0, 0, 1, 16);
      g.fillRect(15, 0, 1, 16);
    });
    SpriteGenerator.drawTexture(scene, 'stalactite', 16, 24, (g) => {
      g.fillStyle(0x52406e, 1);
      g.fillTriangle(0, 0, 16, 0, 8, 24);
      g.fillStyle(0x7a5e9f, 1);
      g.fillTriangle(2, 0, 14, 0, 8, 18);
      g.fillStyle(0x9a7dc6, 1);
      g.fillTriangle(5, 0, 11, 0, 8, 8);
    });
  }

  private static generateClownBossFrames(scene: Phaser.Scene): void {
    // 1=outline 2=skin 3=eye 4=hair 5=hat 6=suit 7=button 8=mouth 9=nose
    const matrix1: number[][] = [
      [0, 0, 0, 5, 5, 5, 5, 5, 5, 0, 0, 0],
      [0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0],
      [0, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 0],
      [0, 4, 1, 2, 2, 2, 2, 2, 2, 1, 4, 0],
      [0, 1, 2, 2, 3, 2, 2, 3, 2, 2, 1, 0],
      [0, 1, 2, 2, 2, 9, 9, 2, 2, 2, 1, 0],
      [0, 1, 2, 2, 8, 8, 8, 8, 2, 2, 1, 0],
      [0, 0, 1, 6, 6, 6, 6, 6, 6, 1, 0, 0],
      [0, 6, 6, 6, 7, 6, 6, 7, 6, 6, 6, 0],
      [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0],
      [0, 6, 6, 6, 6, 7, 7, 6, 6, 6, 6, 0],
      [0, 0, 6, 6, 0, 0, 0, 0, 6, 6, 0, 0],
    ];
    const matrix2 = matrix1.map((row) => row.slice());
    const palette1: Record<number, number> = {
      1: 0x222222,
      2: 0xfdd9b5,
      3: 0x1a1a1a,
      4: 0xff6677,
      5: 0x9c2845,
      6: 0xffd24d,
      7: 0xb40036,
      8: 0xb40036,
      9: 0xff3344,
    };
    const palette2: Record<number, number> = {
      ...palette1,
      4: 0xff99cc,
      5: 0xcc1166,
      6: 0xff66aa,
      7: 0xff007f,
      8: 0xffffff,
      9: 0xffffff,
    };
    const pxSize = 5;
    const w = matrix1[0].length * pxSize;
    const h = matrix1.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'clown_boss', w, h, (g) =>
      drawFromMatrix(g, matrix1, palette1, pxSize),
    );
    SpriteGenerator.drawTexture(scene, 'clown_boss_phase2', w, h, (g) =>
      drawFromMatrix(g, matrix2, palette2, pxSize),
    );
  }

  private static generateScarecrowBossFrames(scene: Phaser.Scene): void {
    // 1=outline 2=hat 3=face 4=eye 5=shirt 6=straw 7=arm
    const matrix1: number[][] = [
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0],
      [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0],
      [0, 0, 0, 1, 3, 3, 3, 1, 0, 0, 0],
      [0, 0, 1, 3, 4, 3, 4, 3, 1, 0, 0],
      [0, 0, 1, 3, 3, 1, 3, 3, 1, 0, 0],
      [0, 0, 1, 3, 1, 1, 1, 3, 1, 0, 0],
      [0, 7, 5, 5, 5, 5, 5, 5, 5, 7, 0],
      [7, 7, 5, 5, 6, 5, 6, 5, 5, 7, 7],
      [0, 7, 5, 5, 5, 5, 5, 5, 5, 7, 0],
      [0, 0, 6, 5, 5, 5, 5, 5, 6, 0, 0],
      [0, 0, 6, 6, 0, 0, 0, 6, 6, 0, 0],
    ];
    const palette1: Record<number, number> = {
      1: 0x111111,
      2: 0x3d2a13,
      3: 0xc8a070,
      4: 0xff2222,
      5: 0x4a3a25,
      6: 0xc0a040,
      7: 0x6b4a25,
    };
    const palette2 = { ...palette1, 4: 0xff66aa, 2: 0x551122, 5: 0x6e3a25 };
    const pxSize = 5;
    const w = matrix1[0].length * pxSize;
    const h = matrix1.length * pxSize;
    SpriteGenerator.drawTexture(scene, 'scarecrow_boss', w, h, (g) =>
      drawFromMatrix(g, matrix1, palette1, pxSize),
    );
    SpriteGenerator.drawTexture(scene, 'scarecrow_boss_phase2', w, h, (g) =>
      drawFromMatrix(g, matrix1, palette2, pxSize),
    );
  }

  private static generateMiniClown(scene: Phaser.Scene): void {
    const matrix: number[][] = [
      [0, 0, 5, 5, 5, 5, 0, 0],
      [0, 4, 4, 5, 5, 4, 4, 0],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [0, 1, 2, 3, 2, 3, 1, 0],
      [0, 1, 2, 9, 9, 2, 1, 0],
      [0, 1, 2, 8, 8, 2, 1, 0],
      [0, 6, 6, 7, 7, 6, 6, 0],
      [0, 6, 0, 0, 0, 0, 6, 0],
    ];
    const palette: Record<number, number> = {
      1: 0x222222,
      2: 0xfdd9b5,
      3: 0x000000,
      4: 0xff66aa,
      5: 0xcc1166,
      6: 0xffd24d,
      7: 0xb40036,
      8: 0xb40036,
      9: 0xff3344,
    };
    const pxSize = 4;
    SpriteGenerator.drawTexture(
      scene,
      'mini_clown',
      matrix[0].length * pxSize,
      matrix.length * pxSize,
      (g) => drawFromMatrix(g, matrix, palette, pxSize),
    );
  }

  private static generateMiniScarecrow(scene: Phaser.Scene): void {
    const matrix: number[][] = [
      [0, 2, 2, 2, 2, 2, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 1, 3, 4, 3, 1, 0],
      [0, 1, 3, 3, 3, 1, 0],
      [0, 5, 5, 5, 5, 5, 0],
      [5, 5, 6, 5, 6, 5, 5],
      [0, 5, 5, 5, 5, 5, 0],
      [0, 6, 0, 0, 0, 6, 0],
    ];
    const palette: Record<number, number> = {
      1: 0x111111,
      2: 0x3d2a13,
      3: 0xc8a070,
      4: 0xff2222,
      5: 0x4a3a25,
      6: 0xc0a040,
    };
    const pxSize = 4;
    SpriteGenerator.drawTexture(
      scene,
      'mini_scarecrow',
      matrix[0].length * pxSize,
      matrix.length * pxSize,
      (g) => drawFromMatrix(g, matrix, palette, pxSize),
    );
  }

  private static generateFireGhost(scene: Phaser.Scene): void {
    const matrix: number[][] = [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [1, 2, 3, 2, 2, 3, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 4, 4, 2, 2, 1],
      [1, 2, 4, 4, 4, 4, 2, 1],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [0, 0, 4, 0, 0, 4, 0, 0],
    ];
    const palette: Record<number, number> = {
      1: 0x551800,
      2: 0xff6622,
      3: 0xffffaa,
      4: 0xffaa33,
    };
    const pxSize = 4;
    SpriteGenerator.drawTexture(
      scene,
      'fire_ghost',
      matrix[0].length * pxSize,
      matrix.length * pxSize,
      (g) => drawFromMatrix(g, matrix, palette, pxSize),
    );
  }

  private static generateCrow(scene: Phaser.Scene): void {
    const matrix: number[][] = [
      [0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 2, 2, 2, 1, 0],
      [0, 1, 2, 2, 3, 2, 1, 4],
      [1, 2, 2, 2, 2, 2, 1, 4],
      [1, 1, 2, 2, 2, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0, 0],
    ];
    const palette: Record<number, number> = {
      1: 0x000000,
      2: 0x222244,
      3: 0xffaa00,
      4: 0x111111,
    };
    const pxSize = 4;
    SpriteGenerator.drawTexture(
      scene,
      'crow',
      matrix[0].length * pxSize,
      matrix.length * pxSize,
      (g) => drawFromMatrix(g, matrix, palette, pxSize),
    );
  }

  private static generateJuggleBall(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'juggle_ball', 12, 12, (g) => {
      g.fillStyle(0xff66cc, 1);
      g.fillCircle(6, 6, 6);
      g.fillStyle(0xffe600, 1);
      g.fillCircle(5, 5, 3);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 1);
    });
  }

  private static generateFireTrail(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'fire_trail', 14, 14, (g) => {
      g.fillStyle(0xff3300, 1);
      g.fillCircle(7, 7, 7);
      g.fillStyle(0xff8800, 1);
      g.fillCircle(7, 7, 5);
      g.fillStyle(0xffe600, 1);
      g.fillCircle(7, 7, 2);
    });
  }

  private static generateStarPickup(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'star_pickup', 24, 24, (g) => {
      const cx = 12;
      const cy = 12;
      const outer = 11;
      const inner = 5;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }
      g.fillStyle(0x886600, 1);
      g.fillPoints(pts, true);
      const innerPts = pts.map((p) => ({ x: cx + (p.x - cx) * 0.85, y: cy + (p.y - cy) * 0.85 }));
      g.fillStyle(0xffe600, 1);
      g.fillPoints(innerPts, true);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(cx - 2, cy - 2, 2);
    });
  }

  private static generateExtraHeartPickup(scene: Phaser.Scene): void {
    SpriteGenerator.drawTexture(scene, 'extra_heart_pickup', 24, 22, (g) => {
      g.fillStyle(0x880022, 1);
      g.fillCircle(7, 8, 7);
      g.fillCircle(17, 8, 7);
      g.fillTriangle(1, 10, 23, 10, 12, 22);
      g.fillStyle(0xff2244, 1);
      g.fillCircle(7, 8, 5);
      g.fillCircle(17, 8, 5);
      g.fillTriangle(3, 10, 21, 10, 12, 19);
      g.fillStyle(0xffaabb, 1);
      g.fillCircle(5, 6, 2);
    });
  }
}
