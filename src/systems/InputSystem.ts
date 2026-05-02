import type Phaser from 'phaser';

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  jumpDown: boolean;
  jumpReleased: boolean;
  shootPressed: boolean;
  pausePressed: boolean;
  down: boolean;
}

const LEFT_KEYS = ['ArrowLeft', 'KeyA'];
const RIGHT_KEYS = ['ArrowRight', 'KeyD'];
const DOWN_KEYS = ['ArrowDown', 'KeyS'];
const JUMP_KEYS = ['ArrowUp', 'KeyW', 'Space'];
const SHOOT_KEYS = ['KeyZ', 'KeyJ'];
const PAUSE_KEYS = ['Escape', 'KeyP'];

export class InputSystem {
  private heldKeys: Set<string> = new Set();
  private pressedQueue: Set<string> = new Set();
  private releasedQueue: Set<string> = new Set();
  private detached = false;

  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private readonly onKeyUp: (e: KeyboardEvent) => void;

  constructor(scene?: Phaser.Scene) {
    this.onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') e.preventDefault();
      this.virtualKeyDown(e.code);
    };
    this.onKeyUp = (e: KeyboardEvent) => {
      this.virtualKeyUp(e.code);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
    }
    if (scene) {
      scene.events.once('shutdown', () => this.detach());
      scene.events.once('destroy', () => this.detach());
    }
  }

  /** Programmatic key press — used by TouchControls and tests. */
  virtualKeyDown(code: string): void {
    if (!this.heldKeys.has(code)) {
      this.pressedQueue.add(code);
    }
    this.heldKeys.add(code);
  }

  /** Programmatic key release — used by TouchControls and tests. */
  virtualKeyUp(code: string): void {
    this.heldKeys.delete(code);
    this.releasedQueue.add(code);
  }

  private anyHeld(codes: readonly string[]): boolean {
    for (const c of codes) if (this.heldKeys.has(c)) return true;
    return false;
  }

  private anyInQueue(codes: readonly string[], queue: Set<string>): boolean {
    for (const c of codes) if (queue.has(c)) return true;
    return false;
  }

  read(): InputState {
    const state: InputState = {
      left: this.anyHeld(LEFT_KEYS),
      right: this.anyHeld(RIGHT_KEYS),
      down: this.anyHeld(DOWN_KEYS),
      jumpDown: this.anyHeld(JUMP_KEYS),
      jumpPressed: this.anyInQueue(JUMP_KEYS, this.pressedQueue),
      jumpReleased: this.anyInQueue(JUMP_KEYS, this.releasedQueue),
      shootPressed: this.anyInQueue(SHOOT_KEYS, this.pressedQueue),
      pausePressed: this.anyInQueue(PAUSE_KEYS, this.pressedQueue),
    };
    this.pressedQueue.clear();
    this.releasedQueue.clear();
    return state;
  }

  detach(): void {
    if (this.detached) return;
    this.detached = true;
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    }
  }
}
