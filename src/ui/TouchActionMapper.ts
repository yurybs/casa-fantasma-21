import { InputSystem } from '../systems/InputSystem';

export type TouchAction = 'left' | 'right' | 'jump' | 'shoot' | 'pause';

export const TOUCH_ACTION_TO_KEY: Record<TouchAction, string> = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  jump: 'Space',
  shoot: 'KeyZ',
  pause: 'Escape',
};

/** Pure helper that forwards touch actions to InputSystem as virtual keys. */
export class TouchActionMapper {
  constructor(private readonly input: InputSystem) {}

  press(action: TouchAction): void {
    this.input.virtualKeyDown(TOUCH_ACTION_TO_KEY[action]);
  }

  release(action: TouchAction): void {
    this.input.virtualKeyUp(TOUCH_ACTION_TO_KEY[action]);
  }
}
