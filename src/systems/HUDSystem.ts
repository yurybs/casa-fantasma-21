import Phaser from 'phaser';

export interface HUDState {
  hp: number;
  maxHp: number;
  lives: number;
  coins: number;
  timeRemaining: number;
}

export class HUDSystem {
  private scene: Phaser.Scene;
  private heartIcons: Phaser.GameObjects.Text[] = [];
  private livesText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private container!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.container = this.scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);
    const heartCount = 3;
    for (let i = 0; i < heartCount; i++) {
      const t = this.scene.add.text(8 + i * 28, 8, 'HP', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ff3344',
      });
      t.setStroke('#000000', 3);
      this.heartIcons.push(t);
      this.container.add(t);
    }
    this.livesText = this.scene.add
      .text(110, 8, 'x3', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' })
      .setStroke('#000000', 3);
    this.coinsText = this.scene.add
      .text(180, 8, '$ 0', { fontFamily: 'monospace', fontSize: '20px', color: '#ffd700' })
      .setStroke('#000000', 3);
    this.timeText = this.scene.add
      .text(680, 8, 'T 400', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' })
      .setStroke('#000000', 3);
    this.container.add([this.livesText, this.coinsText, this.timeText]);
  }

  update(state: HUDState): void {
    const fullHearts = Math.ceil(state.hp / 2);
    this.heartIcons.forEach((icon, i) => {
      const isFull = i < fullHearts;
      icon.setColor(isFull ? '#ff3344' : '#444444');
      icon.setText(isFull ? 'HP' : '--');
      icon.setData('full', isFull);
    });
    this.livesText.setText(`x${state.lives}`);
    this.coinsText.setText(`$ ${state.coins.toString().padStart(3, '0')}`);
    this.timeText.setText(`T ${Math.max(0, Math.ceil(state.timeRemaining)).toString().padStart(3, '0')}`);
  }

  destroy(): void {
    this.container.destroy();
  }
}
