import { describe, it, expect } from 'vitest';
import { InputSystem, InputState } from '../../src/systems/InputSystem';
import { TouchActionMapper, TouchAction } from '../../src/ui/TouchActionMapper';

function snapshotForKeyboard(code: string): InputState {
  const input = new InputSystem();
  input.virtualKeyDown(code);
  return input.read();
}

function snapshotForTouch(action: TouchAction): InputState {
  const input = new InputSystem();
  const mapper = new TouchActionMapper(input);
  mapper.press(action);
  return input.read();
}

describe('TouchInputEquivalence — toques produzem o mesmo InputState que o teclado', () => {
  const cases: { action: TouchAction; key: string; description: string }[] = [
    { action: 'left', key: 'ArrowLeft', description: 'D-pad ← ↔ ArrowLeft' },
    { action: 'right', key: 'ArrowRight', description: 'D-pad → ↔ ArrowRight' },
    { action: 'jump', key: 'Space', description: 'Botão A ↔ Space' },
    { action: 'shoot', key: 'KeyZ', description: 'Botão B ↔ Z' },
    { action: 'pause', key: 'Escape', description: 'Botão Pause ↔ Esc' },
  ];

  for (const c of cases) {
    it(c.description, () => {
      const fromKeyboard = snapshotForKeyboard(c.key);
      const fromTouch = snapshotForTouch(c.action);
      expect(fromTouch).toEqual(fromKeyboard);
    });
  }

  it('toque em → seguido de release devolve estado neutro', () => {
    const input = new InputSystem();
    const mapper = new TouchActionMapper(input);
    mapper.press('right');
    input.read();
    mapper.release('right');
    const state = input.read();
    expect(state.right).toBe(false);
  });

  it('combinação direita + pulo = mesmo InputState que tecla → + Espaço', () => {
    const inputKb = new InputSystem();
    inputKb.virtualKeyDown('ArrowRight');
    inputKb.virtualKeyDown('Space');
    const kbState = inputKb.read();

    const inputTouch = new InputSystem();
    const mapper = new TouchActionMapper(inputTouch);
    mapper.press('right');
    mapper.press('jump');
    const touchState = inputTouch.read();

    expect(touchState).toEqual(kbState);
  });
});
