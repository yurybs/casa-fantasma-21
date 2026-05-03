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
}

const NODES: MapNode[] = [
  { levelIndex: 1, x: 180, y: 360, name: 'Floresta — Início', isBoss: false },
  { levelIndex: 2, x: 400, y: 240, name: 'Arena do Fantasma', isBoss: true },
  { levelIndex: 3, x: 620, y: 360, name: 'Caminho dos Espíritos', isBoss: false },
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
      .text(GAME_WIDTH / 2, 50, 'MUNDO 1 — Floresta Encantada', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4);

    for (let i = 0; i < 14; i++) {
      const x = 60 + i * 56;
      const y = GAME_HEIGHT - 80 + ((i % 2) * 8 - 4);
      this.add.image(x, y, 'tree').setScale(0.6).setAlpha(0.8);
    }

    this.add
      .image(120, 120, 'cloud')
      .setAlpha(0.6);
    this.add
      .image(680, 90, 'cloud')
      .setAlpha(0.5)
      .setScale(0.8);
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
        .circle(node.x, node.y, 22, fillColor, 1)
        .setStrokeStyle(4, strokeColor, 1);
      let bossMark: Phaser.GameObjects.Arc | undefined;
      if (node.isBoss) {
        bossMark = this.add.circle(node.x, node.y, 8, 0x000000, 1);
      }
      const label = this.add
        .text(node.x, node.y + 38, node.name, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: unlocked ? '#ffffff' : '#888888',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 3);
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
    this.livesText = this.add.text(20, GAME_HEIGHT - 30, `Vidas: ${data.lives}    Moedas: ${data.coins}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
    });
    this.titleText = this.add
      .text(GAME_WIDTH / 2, 100, NODES[this.cursorIndex].name, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
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
    this.cursorMarker.setPosition(node.x, node.y - 36);
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
