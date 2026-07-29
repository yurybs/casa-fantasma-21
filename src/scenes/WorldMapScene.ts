import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { fadeIn, fadeToScene } from '../utils/SceneTransition';
import { LEVELS } from '../config/LevelConfig';

interface MapNode {
  levelIndex: number;
  x: number;
  y: number;
  name: string;
  isBoss: boolean;
  world: number;
}

const NODES: MapNode[] = [
  // Mundo 1 — Floresta Encantada (top-left)
  { levelIndex: 1, x: 70, y: 200, name: 'Floresta — Início', isBoss: false, world: 1 },
  { levelIndex: 2, x: 160, y: 130, name: 'Arena do Fantasma', isBoss: true, world: 1 },
  { levelIndex: 3, x: 250, y: 200, name: 'Caminho dos Espíritos', isBoss: false, world: 1 },
  // Mundo 2 — Caverna Assombrada (top-right)
  { levelIndex: 4, x: 380, y: 130, name: 'Arena do Palhaço', isBoss: true, world: 2 },
  { levelIndex: 5, x: 480, y: 200, name: 'Galeria das Tochas', isBoss: false, world: 2 },
  { levelIndex: 6, x: 580, y: 130, name: 'Arena do Espantalho', isBoss: true, world: 2 },
  // Mundo 3 — Cidade Abandonada (bottom row)
  { levelIndex: 7, x: 110, y: 410, name: 'Ruas Vazias', isBoss: false, world: 3 },
  { levelIndex: 8, x: 230, y: 470, name: 'Avenida em Ruínas', isBoss: false, world: 3 },
  { levelIndex: 9, x: 350, y: 410, name: 'Arena do T-Rex', isBoss: true, world: 3 },
  { levelIndex: 10, x: 470, y: 470, name: 'Beco das Sombras', isBoss: false, world: 3 },
  { levelIndex: 11, x: 590, y: 410, name: 'Arena do Vampiro', isBoss: true, world: 3 },
  { levelIndex: 12, x: 700, y: 470, name: 'Praça do Crepúsculo', isBoss: false, world: 3 },
  // Mundo 4 — Castelo do Robô (middle band, right→left)
  { levelIndex: 13, x: 580, y: 300, name: 'Salão das Chamas', isBoss: true, world: 4 },
  { levelIndex: 14, x: 400, y: 300, name: 'Torre de Engrenagens', isBoss: false, world: 4 },
  { levelIndex: 15, x: 220, y: 300, name: 'Câmara do Polvo', isBoss: true, world: 4 },
];

interface NodeVisuals {
  node: MapNode;
  circle: Phaser.GameObjects.Arc;
  bossMark?: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}

/**
 * Mario World–style world-map screen for Mundo 1. Player picks an unlocked
 * level node and enters it. Boss levels (Level 2) route through BossIntroScene.
 */
export class WorldMapScene extends Phaser.Scene {
  private save!: SaveSystem;
  private nodeVisuals: NodeVisuals[] = [];
  private cursorIndex: number = 0;
  private cursorMarker!: Phaser.GameObjects.Triangle;
  private titleText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    fadeIn(this);
    this.cameras.main.setBackgroundColor('#1a3a2a');
    this.save = new SaveSystem();

    this.drawBackdrop();
    this.drawPaths();
    this.buildNodes();
    this.buildHud();

    const startIdx = this.findInitialCursorIndex();
    this.cursorIndex = startIdx;
    this.cursorMarker = this.add
      .triangle(0, 0, -10, -10, 10, -10, 0, 5, 0xffe600)
      .setStrokeStyle(2, 0x000000, 1)
      .setDepth(20);
    this.refreshCursor();

    this.input.keyboard?.on('keydown-LEFT', () => this.moveCursor(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveCursor(1));
    this.input.keyboard?.on('keydown-A', () => this.moveCursor(-1));
    this.input.keyboard?.on('keydown-D', () => this.moveCursor(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.enterSelectedLevel());
    this.input.keyboard?.on('keydown-SPACE', () => this.enterSelectedLevel());
    this.input.keyboard?.on('keydown-ESC', () => fadeToScene(this, 'MenuScene'));

    this.tryStartMapMusic();
    this.exposeTestHooks();
  }

  private drawBackdrop(): void {
    this.add
      .text(GAME_WIDTH / 2, 28, 'MAPA DOS MUNDOS', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4);

    // Mundo 1 backdrop (top-left quadrant) — green forest
    this.add.rectangle(165, 170, 320, 180, 0x1a3a2a, 1).setOrigin(0.5);
    this.add
      .text(165, 70, 'Mundo 1 · Floresta', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#88ff88',
      })
      .setOrigin(0.5);
    this.add.image(60, 90, 'cloud').setAlpha(0.6).setScale(0.6);

    // Mundo 2 backdrop (top-right quadrant) — purple cave
    this.add.rectangle(490, 170, 360, 180, 0x2a1a40, 1).setOrigin(0.5);
    this.add
      .text(490, 70, 'Mundo 2 · Caverna', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#cc88ff',
      })
      .setOrigin(0.5);
    if (this.textures.exists('stalactite')) {
      for (let i = 0; i < 4; i++) {
        const x = 340 + i * 90;
        this.add.image(x, 85, 'stalactite').setAlpha(0.7).setScale(0.7);
      }
    }

    // Mundo 4 backdrop (middle band) — steel castle
    this.add.rectangle(GAME_WIDTH / 2, 300, GAME_WIDTH - 80, 78, 0x1a1d26, 1).setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 268, 'Mundo 4 · Castelo do Robô', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#66ddff',
      })
      .setOrigin(0.5);
    if (this.textures.exists('machine_pillar')) {
      this.add.image(120, 332, 'machine_pillar').setOrigin(0.5, 1).setScale(0.4).setAlpha(0.6);
      this.add.image(680, 332, 'machine_pillar').setOrigin(0.5, 1).setScale(0.4).setAlpha(0.6);
    }

    // Mundo 3 backdrop (bottom strip) — dark city
    this.add.rectangle(GAME_WIDTH / 2, 448, GAME_WIDTH - 60, 164, 0x14141c, 1).setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 378, 'Mundo 3 · Cidade Abandonada', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ff9966',
      })
      .setOrigin(0.5);
    if (this.textures.exists('building')) {
      for (let i = 0; i < 5; i++) {
        const x = 80 + i * 140;
        this.add.image(x, 516, 'building').setOrigin(0.5, 1).setScale(0.45).setAlpha(0.7);
      }
    }
    if (this.textures.exists('lamppost')) {
      this.add.image(180, 516, 'lamppost').setOrigin(0.5, 1).setScale(0.5).setAlpha(0.85);
      this.add.image(620, 516, 'lamppost').setOrigin(0.5, 1).setScale(0.5).setAlpha(0.85);
    }
  }

  private drawPaths(): void {
    const g = this.add.graphics();
    g.lineStyle(6, 0x6b4f2c, 0.8);
    for (let i = 0; i < NODES.length - 1; i++) {
      g.lineBetween(NODES[i].x, NODES[i].y, NODES[i + 1].x, NODES[i + 1].y);
    }
    g.lineStyle(2, 0xddc28a, 0.9);
    for (let i = 0; i < NODES.length - 1; i++) {
      g.lineBetween(NODES[i].x, NODES[i].y, NODES[i + 1].x, NODES[i + 1].y);
    }
  }

  private buildNodes(): void {
    const data = this.save.load();
    this.nodeVisuals = NODES.map((node) => {
      const unlocked = this.save.isLevelUnlocked(node.levelIndex - 1);
      const completed = data.levelsCompleted[node.levelIndex - 1] === true;
      const fillColor = completed ? 0x66ee66 : unlocked ? 0xffe600 : 0x555555;
      const strokeColor = node.isBoss ? 0xff3344 : 0x000000;
      const circle = this.add
        .circle(node.x, node.y, 18, fillColor, 1)
        .setStrokeStyle(3, strokeColor, 1)
        .setDepth(15);
      let bossMark: Phaser.GameObjects.Arc | undefined;
      if (node.isBoss) {
        bossMark = this.add.circle(node.x, node.y, 6, 0x000000, 1).setDepth(16);
      }
      const label = this.add
        .text(node.x, node.y + 28, node.name, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: unlocked ? '#ffffff' : '#888888',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 3)
        .setDepth(15);
      circle.setInteractive({ useHandCursor: unlocked });
      if (unlocked) {
        circle.on('pointerdown', () => {
          this.cursorIndex = NODES.findIndex((n) => n.levelIndex === node.levelIndex);
          this.refreshCursor();
          this.enterSelectedLevel();
        });
      }
      return { node, circle, bossMark, label };
    });
  }

  private buildHud(): void {
    const data = this.save.load();
    this.livesText = this.add
      .text(20, GAME_HEIGHT - 24, `Vidas: ${data.lives}    Moedas: ${data.coins}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setDepth(30);
    this.titleText = this.add
      .text(GAME_WIDTH / 2, 545, NODES[this.cursorIndex].name, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setStroke('#000000', 4);
  }

  private findInitialCursorIndex(): number {
    const data = this.save.load();
    const target = data.currentLevel;
    const idx = NODES.findIndex((n) => n.levelIndex === target);
    if (idx >= 0) return idx;
    for (let i = NODES.length - 1; i >= 0; i--) {
      if (this.save.isLevelUnlocked(NODES[i].levelIndex - 1)) return i;
    }
    return 0;
  }

  private moveCursor(delta: number): void {
    const next = Math.max(0, Math.min(NODES.length - 1, this.cursorIndex + delta));
    if (next === this.cursorIndex) return;
    this.cursorIndex = next;
    this.refreshCursor();
  }

  private refreshCursor(): void {
    const node = NODES[this.cursorIndex];
    this.cursorMarker.setPosition(node.x, node.y - 28);
    this.titleText.setText(node.name);
    const unlocked = this.save.isLevelUnlocked(node.levelIndex - 1);
    this.titleText.setColor(unlocked ? '#ffffff' : '#888888');
  }

  private enterSelectedLevel(): void {
    const node = NODES[this.cursorIndex];
    if (!this.save.isLevelUnlocked(node.levelIndex - 1)) return;
    if (node.isBoss) {
      const level = LEVELS[node.levelIndex - 1];
      const bossType = level.boss?.type ?? 'ghost';
      fadeToScene(this, 'BossIntroScene', { levelIndex: node.levelIndex, bossType });
    } else {
      fadeToScene(this, 'GameScene', { levelIndex: node.levelIndex });
    }
  }

  private tryStartMapMusic(): void {
    const sound = this.registry.get('sound') as SoundSystem | undefined;
    if (sound) {
      void sound.resume().then(() => sound.playMusic('bgm_menu'));
    }
  }

  private exposeTestHooks(): void {
    interface MapHooks {
      getCursorIndex: () => number;
      getCursorLevelIndex: () => number;
      moveCursor: (delta: number) => void;
      enterSelectedLevel: () => void;
      isLevelUnlocked: (levelIndex: number) => boolean;
    }
    const hooks: MapHooks = {
      getCursorIndex: () => this.cursorIndex,
      getCursorLevelIndex: () => NODES[this.cursorIndex].levelIndex,
      moveCursor: (delta) => this.moveCursor(delta),
      enterSelectedLevel: () => this.enterSelectedLevel(),
      isLevelUnlocked: (levelIndex) => this.save.isLevelUnlocked(levelIndex - 1),
    };
    (window as unknown as { __map?: MapHooks }).__map = hooks;
    this.events.once('shutdown', () => {
      delete (window as unknown as { __map?: MapHooks }).__map;
    });
  }
}
