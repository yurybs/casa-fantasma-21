import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';

interface PauseData {
  from: string;
}

export class PauseScene extends Phaser.Scene {
  private fromKey: string = 'GameScene';

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(data: PauseData): void {
    this.fromKey = data?.from ?? 'GameScene';
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    this.add
      .text(cx, cy - 40, 'PAUSADO', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 5);

    const resume = this.add
      .text(cx, cy + 30, '> RETOMAR <', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4)
      .setInteractive({ useHandCursor: true });

    resume.on('pointerdown', () => this.resumeGame());
    this.input.keyboard?.once('keydown-ESC', () => this.resumeGame());
    this.input.keyboard?.once('keydown-P', () => this.resumeGame());
    this.input.keyboard?.once('keydown-ENTER', () => this.resumeGame());

    const quit = this.add
      .text(cx, cy + 90, 'Sair para o Menu', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#bbbbff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    quit.on('pointerdown', () => {
      this.scene.stop(this.fromKey);
      this.scene.start('MenuScene');
    });
  }

  private resumeGame(): void {
    this.scene.resume(this.fromKey);
    this.scene.stop();
  }
}
