import { describe, it, expect, beforeEach } from 'vitest';
import {
  SoundSystem,
  AudioEngine,
  SfxKey,
  MusicKey,
} from '../../src/systems/SoundSystem';
import {
  GameAudioBindings,
  EVENT_TO_SFX,
  GameEvent,
} from '../../src/systems/GameAudioBindings';

class CapturingEngine implements AudioEngine {
  played: SfxKey[] = [];
  music: MusicKey[] = [];
  playSfx(key: SfxKey): void {
    this.played.push(key);
  }
  playMusic(key: MusicKey): void {
    this.music.push(key);
  }
  stopMusic(): void {}
  resume(): void {}
  isResumed(): boolean {
    return true;
  }
}

describe('AudioEvents — wiring entre eventos do jogo e SFX', () => {
  let engine: CapturingEngine;
  let sound: SoundSystem;
  let bindings: GameAudioBindings;

  beforeEach(() => {
    engine = new CapturingEngine();
    sound = new SoundSystem(engine);
    bindings = new GameAudioBindings(sound);
  });

  it('player.coin → SFX coin', () => {
    bindings.emit('player.coin');
    expect(engine.played).toEqual(['coin']);
  });

  it('player.jump → SFX jump', () => {
    bindings.emit('player.jump');
    expect(engine.played).toEqual(['jump']);
  });

  it('player.shoot → SFX shoot', () => {
    bindings.emit('player.shoot');
    expect(engine.played).toEqual(['shoot']);
  });

  it('player.hit → SFX hit', () => {
    bindings.emit('player.hit');
    expect(engine.played).toEqual(['hit']);
  });

  it('player.die → SFX die', () => {
    bindings.emit('player.die');
    expect(engine.played).toEqual(['die']);
  });

  it('enemy.die → SFX enemy_die', () => {
    bindings.emit('enemy.die');
    expect(engine.played).toEqual(['enemy_die']);
  });

  it('level.complete → SFX level_clear', () => {
    bindings.emit('level.complete');
    expect(engine.played).toEqual(['level_clear']);
  });

  it('player.power_up → SFX power_up', () => {
    bindings.emit('player.power_up');
    expect(engine.played).toEqual(['power_up']);
  });

  it('múltiplos eventos disparam múltiplos SFX em ordem', () => {
    bindings.emit('player.jump');
    bindings.emit('player.coin');
    bindings.emit('enemy.die');
    expect(engine.played).toEqual(['jump', 'coin', 'enemy_die']);
  });

  it('mudo bloqueia SFX mas não impede o evento', () => {
    sound.setMuted(true);
    bindings.emit('player.coin');
    expect(engine.played).toEqual([]);
  });

  it('todos os GameEvents declarados têm mapeamento de SFX', () => {
    const events: GameEvent[] = [
      'player.jump',
      'player.shoot',
      'player.hit',
      'player.die',
      'player.coin',
      'player.power_up',
      'enemy.die',
      'level.complete',
    ];
    for (const e of events) {
      expect(EVENT_TO_SFX[e]).toBeDefined();
    }
  });
});
