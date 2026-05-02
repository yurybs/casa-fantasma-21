import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { fadeIn, fadeToScene } from '../utils/SceneTransition';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    fadeIn(this);
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor('#1d1f3d');

    this.drawDecor();

    this.add
      .text(cx, 140, 'TOY BLASTER KID', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 6);

    this.add
      .text(cx, 200, 'Sprint 2 — Floresta Encantada Polida', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#aabbff',
      })
      .setOrigin(0.5);

    const playBtn = this.add
      .text(cx, 320, '> JOGAR <', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 5)
      .setInteractive({ useHandCursor: true });

    playBtn.setData('testid', 'menu-play-btn');

    playBtn.on('pointerover', () => playBtn.setColor('#ffffff'));
    playBtn.on('pointerout', () => playBtn.setColor('#ffe600'));
    playBtn.on('pointerdown', () => this.startGame());

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());

    this.add
      .text(cx, GAME_HEIGHT - 80, '← → mover    ESPAÇO pular    Z atirar    ESC pausar', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#bbbbbb',
      })
      .setOrigin(0.5);

    new SaveSystem();

    this.tryStartMenuMusic();
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => this.tryStartMenuMusic());
  }

  private drawDecor(): void {
    const cloud1 = this.add.image(120, 100, 'cloud').setAlpha(0.7);
    const cloud2 = this.add.image(680, 80, 'cloud').setAlpha(0.6).setScale(0.8);
    this.tweens.add({ targets: cloud1, x: '+=20', duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: cloud2, x: '-=20', duration: 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private tryStartMenuMusic(): void {
    const sound = this.registry.get('sound') as SoundSystem | undefined;
    if (sound) {
      void sound.resume().then(() => sound.playMusic('bgm_menu'));
    }
  }

  private startGame(): void {
    fadeToScene(this, 'GameScene', { levelIndex: 1 });
  }
}
