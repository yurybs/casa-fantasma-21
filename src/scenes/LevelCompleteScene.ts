import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';

interface LevelCompleteData {
  levelId: number;
  coins: number;
  timeBonus: number;
}

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  create(data: LevelCompleteData): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.cameras.main.setBackgroundColor('#143a6b');

    this.add
      .text(cx, cy - 100, 'NÍVEL COMPLETO!', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 6);

    this.add
      .text(cx, cy - 30, `Nível ${data?.levelId ?? 1}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 10, `Moedas: ${data?.coins ?? 0}`, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffd700',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 45, `Bônus de Tempo: ${data?.timeBonus ?? 0}`, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#88ff88',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(cx, GAME_HEIGHT - 80, '> VOLTAR AO MENU <', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#aabbff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4)
      .setInteractive({ useHandCursor: true });

    back.on('pointerdown', () => this.scene.start('MenuScene'));
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('MenuScene'));
  }
}
