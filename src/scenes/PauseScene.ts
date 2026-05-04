import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';
import { SoundSystem } from '../systems/SoundSystem';

interface PauseData {
  from: string;
}

export class PauseScene extends Phaser.Scene {
  private fromKey: string = 'GameScene';
  private gameSound?: SoundSystem;
  private musicSliderFill!: Phaser.GameObjects.Rectangle;
  private sfxSliderFill!: Phaser.GameObjects.Rectangle;
  private muteLabel!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(data: PauseData): void {
    this.fromKey = data?.from ?? 'GameScene';
    this.gameSound = this.registry.get('sound') as SoundSystem | undefined;

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    this.add
      .text(cx, cy - 160, 'PAUSADO', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 5);

    this.buildSliders(cx, cy);
    this.buildButtons(cx, cy);

    this.input.keyboard?.once('keydown-ESC', () => this.resumeGame());
    this.input.keyboard?.once('keydown-P', () => this.resumeGame());
    this.input.keyboard?.once('keydown-ENTER', () => this.resumeGame());

    this.exposeTestHooks();
  }

  private exposeTestHooks(): void {
    interface PauseHooks {
      resume: () => void;
      quitToMap: () => void;
      quitToMenu: () => void;
      restart: () => void;
    }
    const hooks: PauseHooks = {
      resume: () => this.resumeGame(),
      quitToMap: () => this.quitTo('WorldMapScene'),
      quitToMenu: () => this.quitTo('MenuScene'),
      restart: () => this.restartLevel(),
    };
    (window as unknown as { __pause?: PauseHooks }).__pause = hooks;
    this.events.once('shutdown', () => {
      delete (window as unknown as { __pause?: PauseHooks }).__pause;
    });
  }

  private buildSliders(cx: number, cy: number): void {
    this.add
      .text(cx, cy - 90, 'Música', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
      .setOrigin(0.5);
    this.musicSliderFill = this.makeSlider(cx, cy - 60, this.gameSound?.musicVolume ?? 0.5, (v) =>
      this.gameSound?.setMusicVolume(v),
    );

    this.add
      .text(cx, cy - 30, 'Efeitos', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
      .setOrigin(0.5);
    this.sfxSliderFill = this.makeSlider(cx, cy, this.gameSound?.sfxVolume ?? 0.7, (v) => {
      this.gameSound?.setSfxVolume(v);
      this.gameSound?.play('coin');
    });

    this.muteLabel = this.add
      .text(cx, cy + 40, this.gameSound?.muted ? '🔇 MUDO' : '🔊 SOM ATIVO', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: this.gameSound?.muted ? '#ff8888' : '#88ff88',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.muteLabel.setData('testid', 'pause-mute-toggle');
    this.muteLabel.on('pointerdown', () => this.toggleMute());
  }

  private makeSlider(
    x: number,
    y: number,
    initialValue: number,
    onChange: (v: number) => void,
  ): Phaser.GameObjects.Rectangle {
    const trackWidth = 220;
    const trackHeight = 12;
    const track = this.add
      .rectangle(x, y, trackWidth, trackHeight, 0x222222, 1)
      .setStrokeStyle(1, 0xffffff, 0.6);
    const fill = this.add
      .rectangle(x - trackWidth / 2 + 2, y, (trackWidth - 4) * initialValue, trackHeight - 4, 0x66ee66)
      .setOrigin(0, 0.5);
    track.setInteractive({ useHandCursor: true });
    track.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const local = Phaser.Math.Clamp((p.x - (x - trackWidth / 2)) / trackWidth, 0, 1);
      fill.width = (trackWidth - 4) * local;
      onChange(local);
    });
    return fill;
  }

  private buildButtons(cx: number, cy: number): void {
    const resume = this.add
      .text(cx, cy + 90, '> RETOMAR <', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4)
      .setInteractive({ useHandCursor: true });
    resume.setData('testid', 'pause-resume');
    resume.on('pointerdown', () => this.resumeGame());

    const restart = this.add
      .text(cx, cy + 130, 'Reiniciar Nível', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#88ddff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    restart.on('pointerdown', () => this.restartLevel());

    const map = this.add
      .text(cx, cy + 165, 'Voltar ao Mapa', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#88ddff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    map.setData('testid', 'pause-quit-to-map');
    map.on('pointerdown', () => this.quitTo('WorldMapScene'));

    const menu = this.add
      .text(cx, cy + 195, 'Menu Principal', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#bbbbff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    menu.setData('testid', 'pause-quit-to-menu');
    menu.on('pointerdown', () => this.quitTo('MenuScene'));
  }

  /**
   * Stop the paused source scene and start the target scene immediately.
   *
   * Note: we deliberately do *not* use fadeToScene here. PauseScene runs as
   * an overlay scene on top of a paused GameScene, and the camera fade-out
   * callback (FADE_OUT_COMPLETE) does not reliably fire in this overlay mode,
   * leaving the user stuck on the pause screen. Direct scene.start works.
   */
  private quitTo(targetKey: string, data?: Record<string, unknown>): void {
    this.scene.stop(this.fromKey);
    this.scene.start(targetKey, data);
  }

  private restartLevel(): void {
    const levelIndex =
      (this.scene.get(this.fromKey) as unknown as { levelIndex?: number })?.levelIndex ?? 1;
    this.quitTo('GameScene', { levelIndex });
  }

  private toggleMute(): void {
    if (!this.gameSound) return;
    const muted = this.gameSound.toggleMute();
    this.muteLabel.setText(muted ? '🔇 MUDO' : '🔊 SOM ATIVO');
    this.muteLabel.setColor(muted ? '#ff8888' : '#88ff88');
  }

  private resumeGame(): void {
    this.scene.resume(this.fromKey);
    this.scene.stop();
  }
}
