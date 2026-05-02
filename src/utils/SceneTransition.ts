import Phaser from 'phaser';

export const TRANSITION_DURATION_MS = 300;

/** Fades the camera in from black on scene start. */
export function fadeIn(scene: Phaser.Scene, durationMs = TRANSITION_DURATION_MS): void {
  scene.cameras.main.fadeIn(durationMs, 0, 0, 0);
}

/**
 * Fades to black, then starts the target scene. Resolves once the target
 * scene receives its CREATE event so transitions chain reliably.
 */
export function fadeToScene(
  scene: Phaser.Scene,
  targetKey: string,
  data?: Record<string, unknown>,
  durationMs = TRANSITION_DURATION_MS,
): void {
  scene.cameras.main.fadeOut(durationMs, 0, 0, 0);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start(targetKey, data);
  });
}
