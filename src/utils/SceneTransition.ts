import Phaser from 'phaser';

export const TRANSITION_DURATION_MS = 300;

/** Fades the camera in from black on scene start. */
export function fadeIn(scene: Phaser.Scene, durationMs = TRANSITION_DURATION_MS): void {
  scene.cameras.main.fadeIn(durationMs, 0, 0, 0);
}

/**
 * Fades to black, then starts the target scene.
 *
 * Uses BOTH the FADE_OUT_COMPLETE camera event AND a delayedCall timer as a
 * fallback. The camera event is the happy path, but Phaser can swallow it
 * when fadeOut is requested while a fadeIn is still in progress (e.g. user
 * presses ESC right after a scene loads). The timer guarantees the target
 * scene always starts, even if the camera event never fires.
 */
export function fadeToScene(
  scene: Phaser.Scene,
  targetKey: string,
  data?: Record<string, unknown>,
  durationMs = TRANSITION_DURATION_MS,
): void {
  let started = false;
  const startTarget = (): void => {
    if (started) return;
    started = true;
    scene.scene.start(targetKey, data);
  };

  scene.cameras.main.fadeOut(durationMs, 0, 0, 0);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, startTarget);
  // Fallback: if FADE_OUT_COMPLETE is swallowed (e.g. interrupted by an
  // in-progress fadeIn), fire after the same duration plus a small slack.
  scene.time.delayedCall(durationMs + 50, startTarget);
}
