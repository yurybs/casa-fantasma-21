import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types/GameTypes';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { fadeIn, fadeToScene } from '../utils/SceneTransition';
import { LEVELS } from '../config/LevelConfig';

export class MenuScene extends Phaser.Scene {
  private save!: SaveSystem;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    fadeIn(this);
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor('#1d1f3d');
    this.save = new SaveSystem();

    this.drawDecor();

    this.add
      .text(cx, 130, 'TOY BLASTER KID', {
        fontFamily: 'monospace',
        fontSize: '52px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 6);

    this.add
      .text(cx, 185, 'Sprint 4 — Mundo 2: Caverna Assombrada', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#cc88ff',
      })
      .setOrigin(0.5);

    const playBtn = this.add
      .text(cx, 290, '> JOGAR <', {
        fontFamily: 'monospace',
        fontSize: '38px',
        color: '#ffe600',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 5)
      .setInteractive({ useHandCursor: true });

    playBtn.setData('testid', 'menu-play-btn');
    playBtn.on('pointerover', () => playBtn.setColor('#ffffff'));
    playBtn.on('pointerout', () => playBtn.setColor('#ffe600'));
    playBtn.on('pointerdown', () => this.startGame());

    const mapBtn = this.add
      .text(cx, 350, 'MAPA DO MUNDO', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#88ddff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4)
      .setInteractive({ useHandCursor: true });

    mapBtn.setData('testid', 'menu-map-btn');
    mapBtn.on('pointerover', () => mapBtn.setColor('#ffffff'));
    mapBtn.on('pointerout', () => mapBtn.setColor('#88ddff'));
    mapBtn.on('pointerdown', () => this.openMap());

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.once('keydown-M', () => this.openMap());

    this.add
      .text(cx, GAME_HEIGHT - 80, '← → mover    ESPAÇO pular    Z atirar    ESC pausar', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#bbbbbb',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, GAME_HEIGHT - 55, 'ENTER: jogar    M: mapa do mundo', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#888888',
      })
      .setOrigin(0.5);

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
    const data = this.save.load();
    const target = Math.max(1, Math.min(LEVELS.length, data.currentLevel));
    const level = LEVELS[target - 1];
    if (level.boss) {
      fadeToScene(this, 'BossIntroScene', { levelIndex: target, bossType: level.boss.type });
    } else {
      fadeToScene(this, 'GameScene', { levelIndex: target });
    }
  }

  private openMap(): void {
    fadeToScene(this, 'WorldMapScene');
  }
}
