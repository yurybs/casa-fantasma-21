import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';
import { SaveSystem } from '../systems/SaveSystem';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor('#1d1f3d');

    this.add
      .text(cx, 140, 'TOY BLASTER KID', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 6);

    this.add
      .text(cx, 200, 'Sprint 1 — MVP Floresta Encantada', {
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
  }

  private startGame(): void {
    this.scene.start('GameScene', { levelIndex: 1 });
  }
}
