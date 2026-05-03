import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';
import { fadeIn, fadeToScene } from '../utils/SceneTransition';
import { BossKind } from '../config/LevelConfig';

interface BossIntroData {
  levelIndex: number;
  bossType: BossKind;
}

interface BossInfo {
  number: string;
  name: string;
  type: string;
  weakness: string;
  spriteKey: string;
}

const BOSS_INFO: Record<BossKind, BossInfo> = {
  ghost: {
    number: '#001',
    name: 'FANTASMA',
    type: 'Espectral',
    weakness: 'Água',
    spriteKey: 'ghost_boss',
  },
};

const INTRO_DURATION_MS = 2000;

/**
 * Pokédex-style intro card shown before each boss fight. Displays the boss
 * silhouette transitioning to its full sprite, with name + type + weakness.
 * Auto-advances to GameScene after 2s or on Enter.
 */
export class BossIntroScene extends Phaser.Scene {
  private levelIndex: number = 2;
  private bossType: BossKind = 'ghost';
  private hasAdvanced: boolean = false;
  private autoAdvanceTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'BossIntroScene' });
  }

  create(data: BossIntroData): void {
    fadeIn(this);
    this.levelIndex = data?.levelIndex ?? 2;
    this.bossType = data?.bossType ?? 'ghost';
    const info = BOSS_INFO[this.bossType] ?? BOSS_INFO.ghost;

    this.cameras.main.setBackgroundColor('#0a0a14');

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Card background
    this.add
      .rectangle(cx, cy, 520, 360, 0x111122, 1)
      .setStrokeStyle(4, 0xffe600, 1);
    this.add
      .rectangle(cx, cy - 130, 480, 60, 0x1a1a3a, 1)
      .setStrokeStyle(2, 0xffe600, 0.8);

    this.add
      .text(cx, cy - 130, `BOSS ${info.number}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4);

    const sprite = this.add.image(cx, cy - 30, info.spriteKey);
    sprite.setScale(3);
    sprite.setTintFill(0x000000); // silhouette

    this.tweens.add({
      targets: sprite,
      scaleX: 4,
      scaleY: 4,
      duration: 1000,
      ease: 'Sine.easeInOut',
    });
    this.time.delayedCall(900, () => {
      sprite.clearTint();
    });

    this.add
      .text(cx, cy + 70, info.name, {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 5);

    this.add
      .text(cx, cy + 110, `Tipo: ${info.type}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#bbbbff',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 138, `Fraqueza: ${info.weakness}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#88ddff',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT - 40, 'pressione ENTER para começar', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#888888',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => this.advance());
    this.input.keyboard?.once('keydown-SPACE', () => this.advance());
    this.autoAdvanceTimer = this.time.delayedCall(INTRO_DURATION_MS, () => this.advance());

    this.exposeTestHooks();
  }

  private advance(): void {
    if (this.hasAdvanced) return;
    this.hasAdvanced = true;
    this.autoAdvanceTimer?.remove(false);
    fadeToScene(this, 'GameScene', { levelIndex: this.levelIndex });
  }

  private exposeTestHooks(): void {
    interface IntroHooks {
      advance: () => void;
      getBossType: () => BossKind;
      getLevelIndex: () => number;
    }
    const hooks: IntroHooks = {
      advance: () => this.advance(),
      getBossType: () => this.bossType,
      getLevelIndex: () => this.levelIndex,
    };
    (window as unknown as { __bossIntro?: IntroHooks }).__bossIntro = hooks;
    this.events.once('shutdown', () => {
      delete (window as unknown as { __bossIntro?: IntroHooks }).__bossIntro;
    });
  }
}
