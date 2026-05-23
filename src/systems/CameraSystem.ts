/**
 * Pure-logic camera shake system. Tracks intensity over time with linear
 * decay. The owner scene reads `offsetX`/`offsetY` each frame and applies
 * them to the Phaser camera (or any consumer).
 *
 * Multiple `shake()` calls stack by taking the strongest active impulse —
 * a stronger shake overrides a weaker residual one, but a weaker shake
 * does NOT replace a stronger one already in flight.
 */
export class CameraSystem {
  /** Current shake intensity (px). Decreases linearly to 0 over `durationMs`. */
  private intensity: number = 0;
  /** Peak intensity for the active shake (used to compute decay rate). */
  private peakIntensity: number = 0;
  /** Total duration of the active shake. */
  private durationMs: number = 0;
  /** Remaining time of the active shake. */
  private remainingMs: number = 0;
  /** Current per-axis offsets, recomputed each tick. */
  offsetX: number = 0;
  offsetY: number = 0;

  /**
   * Trigger a shake. If an existing shake is stronger, the call is ignored
   * so light effects don't cancel earthquake-grade impulses.
   *
   * @param intensity Peak displacement in pixels.
   * @param durationMs Total length of the shake in ms.
   */
  shake(intensity: number, durationMs: number): void {
    if (intensity <= 0 || durationMs <= 0) return;
    if (intensity < this.intensity) return;
    this.intensity = intensity;
    this.peakIntensity = intensity;
    this.durationMs = durationMs;
    this.remainingMs = durationMs;
  }

  /** True if a shake is currently affecting the camera. */
  get isShaking(): boolean {
    return this.remainingMs > 0;
  }

  /** Immediately cancels any in-flight shake and zeros offsets. */
  reset(): void {
    this.intensity = 0;
    this.peakIntensity = 0;
    this.durationMs = 0;
    this.remainingMs = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  /**
   * Advance the shake by `deltaMs`. Linear decay from `peakIntensity` to 0.
   * Offsets are deterministic (uses Math.sin) so unit tests can assert them.
   */
  update(deltaMs: number): void {
    if (this.remainingMs <= 0) {
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }
    this.remainingMs = Math.max(0, this.remainingMs - deltaMs);
    const t = 1 - this.remainingMs / this.durationMs; // 0 → 1
    this.intensity = this.peakIntensity * (1 - t);

    // Pseudo-random pattern from sin combinations: deterministic, oscillating.
    const phase = (this.durationMs - this.remainingMs) / 20;
    this.offsetX = Math.sin(phase * 1.3) * this.intensity;
    this.offsetY = Math.cos(phase * 1.7) * this.intensity;

    if (this.remainingMs === 0) {
      this.offsetX = 0;
      this.offsetY = 0;
      this.intensity = 0;
      this.peakIntensity = 0;
    }
  }
}
