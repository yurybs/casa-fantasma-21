import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';
import { fadeIn, fadeToScene } from '../utils/SceneTransition';

interface GameOverData {
  coins: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    fadeIn(this);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.cameras.main.setBackgroundColor('#1a0010');

    this.add
      .text(cx, cy - 80, 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#ff3344',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 6);

    this.add
      .text(cx, cy, `Moedas: ${data?.coins ?? 0}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const retry = this.add
      .text(cx, cy + 80, '> TENTAR DE NOVO <', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4)
      .setInteractive({ useHandCursor: true });

    retry.on('pointerdown', () => fadeToScene(this, 'GameScene', { levelIndex: 1 }));

    const menu = this.add
      .text(cx, cy + 130, 'voltar ao menu', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#bbbbff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menu.on('pointerdown', () => fadeToScene(this, 'MenuScene'));

    this.input.keyboard?.once('keydown-ENTER', () =>
      fadeToScene(this, 'GameScene', { levelIndex: 1 }),
    );
  }
}
