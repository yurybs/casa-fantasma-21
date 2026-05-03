import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';
import { fadeIn, fadeToScene } from '../utils/SceneTransition';
import { LEVELS } from '../config/LevelConfig';

interface LevelCompleteData {
  levelId: number;
  levelIndex?: number;
  coins: number;
  timeBonus: number;
}

export class LevelCompleteScene extends Phaser.Scene {
  private nextLevelIndex: number | null = null;

  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  create(data: LevelCompleteData): void {
    fadeIn(this);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.cameras.main.setBackgroundColor('#143a6b');

    const completedIndex = data?.levelIndex ?? data?.levelId ?? 1;
    const next = completedIndex + 1;
    this.nextLevelIndex = next <= LEVELS.length ? next : null;

    this.add
      .text(cx, cy - 130, 'NÍVEL COMPLETO!', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 6);

    this.add
      .text(cx, cy - 60, `Nível ${data?.levelId ?? 1}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 20, `Moedas: ${data?.coins ?? 0}`, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffd700',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 15, `Bônus de Tempo: ${data?.timeBonus ?? 0}`, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#88ff88',
      })
      .setOrigin(0.5);

    if (this.nextLevelIndex) {
      const nextBtn = this.add
        .text(cx, cy + 80, '> PRÓXIMO NÍVEL <', {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: '#ffe600',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 4)
        .setInteractive({ useHandCursor: true });
      nextBtn.on('pointerdown', () => this.goToNextLevel());
      this.input.keyboard?.once('keydown-ENTER', () => this.goToNextLevel());
    } else {
      this.add
        .text(cx, cy + 80, 'MUNDO 1 COMPLETO!', {
          fontFamily: 'monospace',
          fontSize: '24px',
          color: '#88ff88',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 4);
      this.input.keyboard?.once('keydown-ENTER', () => fadeToScene(this, 'WorldMapScene'));
    }

    const map = this.add
      .text(cx, GAME_HEIGHT - 100, 'Mapa do Mundo', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#88ddff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    map.on('pointerdown', () => fadeToScene(this, 'WorldMapScene'));

    const back = this.add
      .text(cx, GAME_HEIGHT - 60, 'Menu Principal', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aabbff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => fadeToScene(this, 'MenuScene'));
  }

  private goToNextLevel(): void {
    if (!this.nextLevelIndex) return;
    const next = LEVELS[this.nextLevelIndex - 1];
    if (next.boss) {
      fadeToScene(this, 'BossIntroScene', {
        levelIndex: this.nextLevelIndex,
        bossType: next.boss.type,
      });
    } else {
      fadeToScene(this, 'GameScene', { levelIndex: this.nextLevelIndex });
    }
  }
}
