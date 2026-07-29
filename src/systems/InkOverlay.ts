import Phaser from 'phaser';

const DEFAULT_DARKEN_ALPHA = 0.7;

/**
 * Ink darkening effect for the OctopusBoss. Squirts a near-opaque dark overlay
 * over the whole screen for a fixed duration, then fades it out. Models the
 * "tinta escurece a tela" mechanic.
 *
 * Pure scene side-effect: start(durationMs) shows the overlay and schedules
 * auto-fade; stop() clears it immediately. isActive reflects the current
 * state so tests/HUD can query it.
 */
export class InkOverlay {
  private scene: Phaser.Scene;
  private overlay?: Phaser.GameObjects.Rectangle;
  private fadeTween?: Phaser.Tweens.Tween;
  private timer?: Phaser.Time.TimerEvent;
  private active: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get isActive(): boolean {
    return this.active;
  }

  /** Splash ink for `durationMs`, then fade out over the last 600ms. */
  start(durationMs: number, alpha: number = DEFAULT_DARKEN_ALPHA): void {
    // Refresh if already active — restart the timer at full darkness.
    this.clearTimers();
    const cam = this.scene.cameras.main;
    if (!this.overlay) {
      this.overlay = this.scene.add
        .rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x05010a, alpha)
        .setScrollFactor(0)
        .setDepth(950);
    }
    this.overlay.setAlpha(alpha);
    this.overlay.setVisible(true);
    this.active = true;

    const fadeMs = Math.min(600, durationMs);
    this.timer = this.scene.time.delayedCall(Math.max(0, durationMs - fadeMs), () => {
      this.fadeTween = this.scene.tweens.add({
        targets: this.overlay,
        alpha: 0,
        duration: fadeMs,
        ease: 'Sine.easeIn',
        onComplete: () => this.stop(),
      });
    });
  }

  stop(): void {
    this.clearTimers();
    this.active = false;
    this.overlay?.destroy();
    this.overlay = undefined;
  }

  private clearTimers(): void {
    this.timer?.remove(false);
    this.timer = undefined;
    this.fadeTween?.stop();
    this.fadeTween = undefined;
  }
}
