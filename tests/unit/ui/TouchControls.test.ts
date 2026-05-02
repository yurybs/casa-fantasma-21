import { describe, it, expect, beforeEach } from 'vitest';
import { InputSystem } from '../../../src/systems/InputSystem';
import { TouchActionMapper, TOUCH_ACTION_TO_KEY } from '../../../src/ui/TouchActionMapper';

describe('TouchActionMapper', () => {
  let input: InputSystem;
  let mapper: TouchActionMapper;

  beforeEach(() => {
    input = new InputSystem();
    mapper = new TouchActionMapper(input);
  });

  it('toque em ← gera mesmo InputState que tecla ArrowLeft', () => {
    mapper.press('left');
    expect(input.read().left).toBe(true);
  });

  it('toque em → gera mesmo InputState que tecla ArrowRight', () => {
    mapper.press('right');
    expect(input.read().right).toBe(true);
  });

  it('toque no botão A gera mesmo InputState que tecla Espaço', () => {
    mapper.press('jump');
    const state = input.read();
    expect(state.jumpPressed).toBe(true);
    expect(state.jumpDown).toBe(true);
  });

  it('toque no botão B gera mesmo InputState que tecla Z', () => {
    mapper.press('shoot');
    expect(input.read().shootPressed).toBe(true);
  });

  it('toque no botão Pause gera mesmo InputState que tecla Esc', () => {
    mapper.press('pause');
    expect(input.read().pausePressed).toBe(true);
  });

  it('release limpa estado held', () => {
    mapper.press('right');
    expect(input.read().right).toBe(true);
    mapper.release('right');
    expect(input.read().right).toBe(false);
  });

  it('release de jump limpa jumpDown', () => {
    mapper.press('jump');
    input.read();
    mapper.release('jump');
    const state = input.read();
    expect(state.jumpDown).toBe(false);
    expect(state.jumpReleased).toBe(true);
  });

  it('múltiplos toques simultâneos coexistem', () => {
    mapper.press('right');
    mapper.press('jump');
    const state = input.read();
    expect(state.right).toBe(true);
    expect(state.jumpPressed).toBe(true);
  });

  it('mapeia toda ação para o código de tecla esperado', () => {
    expect(TOUCH_ACTION_TO_KEY.left).toBe('ArrowLeft');
    expect(TOUCH_ACTION_TO_KEY.right).toBe('ArrowRight');
    expect(TOUCH_ACTION_TO_KEY.jump).toBe('Space');
    expect(TOUCH_ACTION_TO_KEY.shoot).toBe('KeyZ');
    expect(TOUCH_ACTION_TO_KEY.pause).toBe('Escape');
  });

  it('virtualKeyDown direto produz mesmo efeito que mapper', () => {
    input.virtualKeyDown('ArrowRight');
    expect(input.read().right).toBe(true);
  });
});
