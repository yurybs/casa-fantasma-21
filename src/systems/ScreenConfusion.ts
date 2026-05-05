import Phaser from 'phaser';

/**
 * Visual "confusion" effect for boss Phase 2 (ClownBoss). Combines:
 * - Camera rotation oscillation
 * - Pulsing color tint overlay
 * - Subtle camera shake
 *
 * Pure scene side-effect: start() activates the tweens and overlay,
 * stop() reverts. Owner is responsible for calling stop() when boss dies.
 */
export class ScreenConfusion {
  private scene: Phaser.Scene;
  private overlay?: Phaser.GameObjects.Rectangle;
  private rotationTween?: Phaser.Tweens.Tween;
  private overlayTween?: Phaser.Tweens.Tween;
  private active: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get isActive(): boolean {
    return this.active;
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    const cam = this.scene.cameras.main;
    const fx = { rot: 0 };
    this.rotationTween = this.scene.tweens.add({
      targets: fx,
      rot: 0.06,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => cam.setRotation(fx.rot - 0.03),
    });

    this.overlay = this.scene.add
      .rectangle(
        cam.width / 2,
        cam.height / 2,
        cam.width,
        cam.height,
        0xff66cc,
        0.15,
      )
      .setScrollFactor(0)
      .setDepth(900)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.overlayTween = this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0.0,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    this.rotationTween?.stop();
    this.rotationTween = undefined;
    this.overlayTween?.stop();
    this.overlayTween = undefined;
    this.overlay?.destroy();
    this.overlay = undefined;
    this.scene.cameras.main.setRotation(0);
  }
}
