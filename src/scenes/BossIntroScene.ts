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
  trex: {
    number: '#004',
    name: 'T-REX',
    type: 'Bestial',
    weakness: 'Contra-ataque após carga',
    spriteKey: 'trex_boss',
  },
  vampire: {
    number: '#005',
    name: 'VAMPIRO',
    type: 'Noturno',
    weakness: 'Água (bloqueia lifesteal)',
    spriteKey: 'vampire_boss',
  },
  fireball: {
    number: '#006',
    name: 'BOLA DE FOGO',
    type: 'Ígneo',
    weakness: 'Água',
    spriteKey: 'fireball_boss',
  },
  octopus: {
    number: '#007',
    name: 'POLVO',
    type: 'Abissal',
    weakness: 'Combo aéreo',
    spriteKey: 'octopus_boss',
  },
};

/**
 * Ignore advance input during the first INPUT_GRACE_MS so a residual
 * Enter/Space from the previous scene (LevelCompleteScene, WorldMap)
 * does not auto-skip the boss card. After the grace period a *queued*
 * early press still advances — we don't drop the user's intent.
 */
const INPUT_GRACE_MS = 250;

/**
 * Pokédex-style intro card shown before each boss fight. Displays the boss
 * silhouette transitioning to its full sprite, with name + type + weakness.
 *
 * Input contract:
 * - ENTER / SPACE / pointer click → advance to GameScene
 * - ESC → cancel and return to WorldMapScene (skip the boss for now)
 * - Auto-advance after INTRO_DURATION_MS (2s) if no input
 *
 * Robustness:
 * - Uses `on` (not `once`) so listeners aren't consumed by stray events.
 * - Polls keyboard state in update() as a fallback in case the keydown
 *   listener didn't fire (defensive — Phaser's keyboard plugin can miss
 *   events when the scene is created mid-fade in some browsers).
 * - An advance press received during the grace period is *queued*, then
 *   fired exactly when the grace expires.
 */
export class BossIntroScene extends Phaser.Scene {
  private levelIndex: number = 2;
  private bossType: BossKind = 'ghost';
  private hasAdvanced: boolean = false;
  private inputUnlockedAt: number = 0;
  private queuedAdvance: boolean = false;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private escKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'BossIntroScene' });
  }

  create(data: BossIntroData): void {
    fadeIn(this);
    this.levelIndex = data?.levelIndex ?? 2;
    this.bossType = data?.bossType ?? 'ghost';
    this.hasAdvanced = false;
    this.queuedAdvance = false;
    const info = BOSS_INFO[this.bossType] ?? BOSS_INFO.ghost;

    this.cameras.main.setBackgroundColor('#0a0a14');

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add
      .rectangle(cx, cy, 520, 400, 0x111122, 1)
      .setStrokeStyle(4, 0xffe600, 1);

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

    const sprite = this.add.image(cx, cy - 50, info.spriteKey);
    sprite.setDisplaySize(120, 120);
    sprite.setTintFill(0x000000);

    this.tweens.add({
      targets: sprite,
      displayWidth: 140,
      displayHeight: 140,
      duration: 900,
      ease: 'Sine.easeInOut',
    });
    this.time.delayedCall(900, () => sprite.clearTint());

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
      .text(cx, GAME_HEIGHT - 60, 'ENTER ou clique para começar    ESC para voltar ao mapa', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#888888',
      })
      .setOrigin(0.5);

    this.inputUnlockedAt = this.time.now + INPUT_GRACE_MS;

    // Listener-based input (primary path).
    this.input.keyboard?.on('keydown-ENTER', this.tryAdvanceFromInput, this);
    this.input.keyboard?.on('keydown-SPACE', this.tryAdvanceFromInput, this);
    this.input.keyboard?.on('keydown-ESC', this.cancelToMap, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.tryAdvanceFromInput, this);

    // Polling-based input (fallback in update()).
    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown-ENTER', this.tryAdvanceFromInput, this);
      this.input.keyboard?.off('keydown-SPACE', this.tryAdvanceFromInput, this);
      this.input.keyboard?.off('keydown-ESC', this.cancelToMap, this);
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.tryAdvanceFromInput, this);
    });

    this.exposeTestHooks();
  }

  update(): void {
    // Fallback polling — fires even if event listeners somehow didn't.
    if (this.hasAdvanced) return;
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.tryAdvanceFromInput();
    } else if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.tryAdvanceFromInput();
    } else if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.cancelToMap();
    }

    // Flush a press that happened during grace, the moment we're past it.
    if (this.queuedAdvance && this.time.now >= this.inputUnlockedAt) {
      this.queuedAdvance = false;
      this.advance();
    }
  }

  private tryAdvanceFromInput(): void {
    if (this.hasAdvanced) return;
    if (this.time.now < this.inputUnlockedAt) {
      // Don't drop the press — flush it when the grace period expires.
      this.queuedAdvance = true;
      return;
    }
    this.advance();
  }

  private cancelToMap(): void {
    if (this.hasAdvanced) return;
    this.hasAdvanced = true;
    fadeToScene(this, 'WorldMapScene');
  }

  private advance(): void {
    if (this.hasAdvanced) return;
    this.hasAdvanced = true;
    fadeToScene(this, 'GameScene', { levelIndex: this.levelIndex });
  }

  private exposeTestHooks(): void {
    interface IntroHooks {
      advance: () => void;
      cancel: () => void;
      getBossType: () => BossKind;
      getLevelIndex: () => number;
    }
    const hooks: IntroHooks = {
      advance: () => this.advance(),
      cancel: () => this.cancelToMap(),
      getBossType: () => this.bossType,
      getLevelIndex: () => this.levelIndex,
    };
    (window as unknown as { __bossIntro?: IntroHooks }).__bossIntro = hooks;
    this.events.once('shutdown', () => {
      delete (window as unknown as { __bossIntro?: IntroHooks }).__bossIntro;
    });
  }
}
