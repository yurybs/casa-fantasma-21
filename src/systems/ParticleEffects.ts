import Phaser from 'phaser';

/**
 * Visual feedback layer. All effects are short-lived (≤ 600ms) and use
 * tweens + simple shapes (no external textures) so that the build stays
 * self-contained.
 */
export class ParticleEffects {
  constructor(private readonly scene: Phaser.Scene) {}

  /** Burst of golden sparkles at (x, y). Triggered when a coin is collected. */
  coinSparkle(x: number, y: number): void {
    const colors = [0xffd700, 0xffec80, 0xffaa00];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 60 + Math.random() * 40;
      const c = this.scene.add.rectangle(x, y, 3, 3, colors[i % colors.length]);
      c.setDepth(50);
      this.scene.tweens.add({
        targets: c,
        x: x + Math.cos(angle) * speed * 0.5,
        y: y + Math.sin(angle) * speed * 0.5 - 10,
        alpha: 0,
        scale: 0,
        duration: 380,
        ease: 'Cubic.easeOut',
        onComplete: () => c.destroy(),
      });
    }
  }

  /** Brief white flash on a sprite — used when player takes damage. */
  damageFlash(sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite): void {
    const flash = this.scene.add.rectangle(sprite.x, sprite.y, sprite.displayWidth + 4, sprite.displayHeight + 4, 0xffffff);
    flash.setDepth(60).setAlpha(0.85);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 120,
      onComplete: () => flash.destroy(),
    });
  }

  /** Colorful burst when an enemy dies. */
  enemyDeath(x: number, y: number): void {
    const colors = [0xff4444, 0xff8844, 0xffcc44, 0xffffff];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 60;
      const size = 2 + Math.random() * 3;
      const p = this.scene.add.rectangle(x, y, size, size, colors[i % colors.length]);
      p.setDepth(50);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 480,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  /** Puff of dust when player lands a high jump. */
  landingDust(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const dir = i < 2 ? -1 : i > 2 ? 1 : 0;
      const p = this.scene.add.circle(x, y, 3, 0xcccccc, 0.6);
      p.setDepth(50);
      this.scene.tweens.add({
        targets: p,
        x: x + dir * (8 + Math.random() * 8),
        y: y - Math.random() * 6,
        alpha: 0,
        scale: 0.3,
        duration: 280,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  /** Trail behind a foam projectile — emit a single dot to be tweened. */
  projectileTrail(x: number, y: number): void {
    const dot = this.scene.add.circle(x, y, 2, 0xeeeeff, 0.6);
    dot.setDepth(40);
    this.scene.tweens.add({
      targets: dot,
      alpha: 0,
      scale: 0.2,
      duration: 220,
      onComplete: () => dot.destroy(),
    });
  }
}
