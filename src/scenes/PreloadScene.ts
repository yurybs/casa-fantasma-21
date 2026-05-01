import Phaser from 'phaser';
import { SpriteGenerator } from '../utils/SpriteGenerator';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const barWidth = 360;
    const barHeight = 24;

    const bg = this.add.rectangle(cx, cy, barWidth, barHeight, 0x222222).setOrigin(0.5);
    const fg = this.add.rectangle(cx - barWidth / 2 + 2, cy, 0, barHeight - 4, 0x66ee66).setOrigin(0, 0.5);
    this.add
      .text(cx, cy - 40, 'Carregando...', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fg.width = (barWidth - 4) * value;
    });

    this.load.on('complete', () => {
      bg.destroy();
      fg.destroy();
    });

    SpriteGenerator.generate(this);
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
