import Phaser from 'phaser';
import { InputSystem } from '../systems/InputSystem';

export type TouchAction = 'left' | 'right' | 'jump' | 'shoot' | 'pause';

const ACTION_TO_KEY: Record<TouchAction, string> = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  jump: 'Space',
  shoot: 'KeyZ',
  pause: 'Escape',
};

interface ButtonSpec {
  action: TouchAction;
  x: number;
  y: number;
  radius: number;
  label: string;
  color: number;
}

export interface TouchControlsOptions {
  /** Force enable on non-touch devices — for tests. */
  forceEnable?: boolean;
}

export class TouchControls {
  readonly enabled: boolean;
  private buttons: { spec: ButtonSpec; container: Phaser.GameObjects.Container; pressed: boolean }[] = [];
  private pointerDownHandler?: (p: Phaser.Input.Pointer) => void;
  private pointerUpHandler?: (p: Phaser.Input.Pointer) => void;
  private pointerMoveHandler?: (p: Phaser.Input.Pointer) => void;
  private activePointerActions: Map<number, TouchAction> = new Map();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly input: InputSystem,
    options: TouchControlsOptions = {},
  ) {
    this.enabled = options.forceEnable ?? this.detectTouch();
  }

  private detectTouch(): boolean {
    if (typeof navigator === 'undefined') return false;
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints! > 0;
    return hasTouch;
  }

  create(): void {
    if (!this.enabled) return;

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const r = 36;
    const pad = 28;

    const specs: ButtonSpec[] = [
      { action: 'left', x: pad + r, y: h - pad - r, radius: r, label: '◀', color: 0x223355 },
      { action: 'right', x: pad + r * 3 + 16, y: h - pad - r, radius: r, label: '▶', color: 0x223355 },
      { action: 'jump', x: w - pad - r * 3 - 16, y: h - pad - r, radius: r, label: 'A', color: 0x227744 },
      { action: 'shoot', x: w - pad - r, y: h - pad - r, radius: r, label: 'B', color: 0x772222 },
      { action: 'pause', x: w - pad - 18, y: pad + 18, radius: 22, label: '⏸', color: 0x444444 },
    ];

    for (const spec of specs) {
      const container = this.buildButton(spec);
      this.buttons.push({ spec, container, pressed: false });
    }

    this.pointerDownHandler = (p: Phaser.Input.Pointer) => this.onPointerDown(p);
    this.pointerUpHandler = (p: Phaser.Input.Pointer) => this.onPointerUp(p);
    this.pointerMoveHandler = (p: Phaser.Input.Pointer) => this.onPointerMove(p);

    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.pointerDownHandler);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.pointerUpHandler);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.pointerUpHandler);
    this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.pointerMoveHandler);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroy());
  }

  private buildButton(spec: ButtonSpec): Phaser.GameObjects.Container {
    const c = this.scene.add.container(spec.x, spec.y);
    c.setScrollFactor(0).setDepth(100);
    const bg = this.scene.add.circle(0, 0, spec.radius, spec.color, 0.7);
    bg.setStrokeStyle(2, 0xffffff, 0.9);
    const text = this.scene.add.text(0, 0, spec.label, {
      fontFamily: 'monospace',
      fontSize: `${Math.floor(spec.radius * 0.9)}px`,
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);
    c.add([bg, text]);
    return c;
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    const action = this.findActionAtPointer(p);
    if (!action) return;
    this.activePointerActions.set(p.id, action);
    this.pressAction(action);
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    const action = this.activePointerActions.get(p.id);
    if (action) {
      this.releaseAction(action);
      this.activePointerActions.delete(p.id);
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (!p.isDown) return;
    const previous = this.activePointerActions.get(p.id);
    const current = this.findActionAtPointer(p);
    if (previous === current) return;
    if (previous) this.releaseAction(previous);
    if (current) {
      this.activePointerActions.set(p.id, current);
      this.pressAction(current);
    } else {
      this.activePointerActions.delete(p.id);
    }
  }

  private findActionAtPointer(p: Phaser.Input.Pointer): TouchAction | null {
    for (const b of this.buttons) {
      const dx = p.x - b.spec.x;
      const dy = p.y - b.spec.y;
      if (dx * dx + dy * dy <= b.spec.radius * b.spec.radius * 1.4) {
        return b.spec.action;
      }
    }
    return null;
  }

  private pressAction(action: TouchAction): void {
    const code = ACTION_TO_KEY[action];
    this.input.virtualKeyDown(code);
    const button = this.buttons.find((b) => b.spec.action === action);
    if (button && !button.pressed) {
      button.pressed = true;
      button.container.setScale(0.92);
      const bg = button.container.list[0] as Phaser.GameObjects.Arc;
      bg.setFillStyle(0xffffff, 0.9);
    }
  }

  private releaseAction(action: TouchAction): void {
    const code = ACTION_TO_KEY[action];
    this.input.virtualKeyUp(code);
    const button = this.buttons.find((b) => b.spec.action === action);
    if (button && button.pressed) {
      button.pressed = false;
      button.container.setScale(1);
      const bg = button.container.list[0] as Phaser.GameObjects.Arc;
      bg.setFillStyle(button.spec.color, 0.7);
    }
  }

  destroy(): void {
    if (this.pointerDownHandler) {
      this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.pointerDownHandler);
      this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.pointerUpHandler);
      this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.pointerUpHandler);
      this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.pointerMoveHandler);
    }
    for (const b of this.buttons) b.container.destroy();
    this.buttons = [];
    this.activePointerActions.clear();
  }
}
