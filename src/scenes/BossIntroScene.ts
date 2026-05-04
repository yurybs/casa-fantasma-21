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
  clown: {
    number: '#002',
    name: 'PALHAÇO',
    type: 'Caótico',
    weakness: 'Estrela',
    spriteKey: 'clown_boss',
  },
  scarecrow: {
    number: '#003',
    name: 'ESPANTALHO',
    type: 'Sombrio',
    weakness: 'Combo aéreo',
    spriteKey: 'scarecrow_boss',
  },
};

const INTRO_DURATION_MS = 2000;
/**
 * Ignore advance input during the first INPUT_GRACE_MS so a residual
 * Enter/Space from the previous scene (LevelCompleteScene, WorldMap)
 * does not auto-skip the boss card.
 */
const INPUT_GRACE_MS = 250;

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
  private inputUnlockedAt: number = 0;

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
      .rectangle(cx, cy, 520, 400, 0x111122, 1)
      .setStrokeStyle(4, 0xffe600, 1);

    // Title bar at the very top of the card
    this.add
      .rectangle(cx, cy - 160, 480, 44, 0x1a1a3a, 1)
      .setStrokeStyle(2, 0xffe600, 0.8);
    this.add
      .text(cx, cy - 160, `BOSS ${info.number}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4);

    // Sprite in its own area, sized explicitly to fit comfortably below title.
    const sprite = this.add.image(cx, cy - 50, info.spriteKey);
    sprite.setDisplaySize(120, 120);
    sprite.setTintFill(0x000000); // silhouette

    this.tweens.add({
      targets: sprite,
      displayWidth: 140,
      displayHeight: 140,
      duration: 900,
      ease: 'Sine.easeInOut',
    });
    this.time.delayedCall(900, () => {
      sprite.clearTint();
    });

    // Name + type + weakness below the sprite
    this.add
      .text(cx, cy + 50, info.name, {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 5);

    this.add
      .text(cx, cy + 100, `Tipo: ${info.type}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#bbbbff',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 130, `Fraqueza: ${info.weakness}`, {
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

    this.inputUnlockedAt = this.time.now + INPUT_GRACE_MS;
    // Use `on` (not `once`) so a key held across the scene transition doesn't
    // consume the listener silently. The grace period + hasAdvanced flag
    // prevent double-fire and accidental skip from a residual press.
    this.input.keyboard?.on('keydown-ENTER', this.tryAdvanceFromInput, this);
    this.input.keyboard?.on('keydown-SPACE', this.tryAdvanceFromInput, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.tryAdvanceFromInput, this);
    this.autoAdvanceTimer = this.time.delayedCall(INTRO_DURATION_MS, () => this.advance());

    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown-ENTER', this.tryAdvanceFromInput, this);
      this.input.keyboard?.off('keydown-SPACE', this.tryAdvanceFromInput, this);
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.tryAdvanceFromInput, this);
    });

    this.exposeTestHooks();
  }

  private tryAdvanceFromInput(): void {
    if (this.time.now < this.inputUnlockedAt) return;
    this.advance();
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
