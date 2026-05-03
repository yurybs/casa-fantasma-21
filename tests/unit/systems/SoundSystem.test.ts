import { describe, it, expect, beforeEach } from 'vitest';
import {
  SoundSystem,
  AudioEngine,
  SfxKey,
  MusicKey,
  NullAudioEngine,
} from '../../../src/systems/SoundSystem';

class FakeEngine implements AudioEngine {
  sfx: { key: SfxKey; volume: number }[] = [];
  music: { key: MusicKey; volume: number; loop: boolean }[] = [];
  stops = 0;
  resumed = true;
  resumeCalls = 0;

  playSfx(key: SfxKey, volume: number): void {
    this.sfx.push({ key, volume });
  }
  playMusic(key: MusicKey, volume: number, loop: boolean): void {
    this.music.push({ key, volume, loop });
  }
  stopMusic(): void {
    this.stops += 1;
  }
  async resume(): Promise<void> {
    this.resumeCalls += 1;
  }
  isResumed(): boolean {
    return this.resumed;
  }
}

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string): string | null {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.data.set(k, v);
  }
}

describe('SoundSystem', () => {
  let engine: FakeEngine;
  let sound: SoundSystem;

  beforeEach(() => {
    engine = new FakeEngine();
    sound = new SoundSystem(engine);
  });

  it('inicia com volumes padrão sensatos', () => {
    expect(sound.musicVolume).toBeCloseTo(0.5);
    expect(sound.sfxVolume).toBeCloseTo(0.7);
    expect(sound.muted).toBe(false);
  });

  it('play() encaminha SFX com volume atual', () => {
    sound.play('coin');
    expect(engine.sfx).toEqual([{ key: 'coin', volume: 0.7 }]);
  });

  it('play() não toca quando engine não está retomada', () => {
    engine.resumed = false;
    sound.play('coin');
    expect(engine.sfx).toHaveLength(0);
  });

  it('play() não toca quando mudo', () => {
    sound.setMuted(true);
    sound.play('coin');
    expect(engine.sfx).toHaveLength(0);
  });

  it('playMusic() inicia música quando engine retomada', () => {
    sound.playMusic('bgm_world1');
    expect(engine.music).toHaveLength(1);
    expect(engine.music[0].key).toBe('bgm_world1');
    expect(engine.music[0].loop).toBe(true);
    expect(sound.currentMusic).toBe('bgm_world1');
  });

  it('playMusic() é idempotente para mesma faixa', () => {
    sound.playMusic('bgm_world1');
    sound.playMusic('bgm_world1');
    expect(engine.music).toHaveLength(1);
  });

  it('playMusic() troca de faixa para outra diferente', () => {
    sound.playMusic('bgm_menu');
    sound.playMusic('bgm_world1');
    expect(engine.music).toHaveLength(2);
    expect(sound.currentMusic).toBe('bgm_world1');
  });

  it('stopMusic() limpa estado e chama engine', () => {
    sound.playMusic('bgm_world1');
    sound.stopMusic();
    expect(sound.currentMusic).toBeNull();
    expect(engine.stops).toBe(1);
  });

  it('setMusicVolume clampa entre 0 e 1', () => {
    sound.setMusicVolume(2);
    expect(sound.musicVolume).toBe(1);
    sound.setMusicVolume(-3);
    expect(sound.musicVolume).toBe(0);
    sound.setMusicVolume(0.42);
    expect(sound.musicVolume).toBeCloseTo(0.42);
  });

  it('setSfxVolume clampa entre 0 e 1', () => {
    sound.setSfxVolume(99);
    expect(sound.sfxVolume).toBe(1);
    sound.setSfxVolume(-1);
    expect(sound.sfxVolume).toBe(0);
  });

  it('setSfxVolume aplica em chamadas play subsequentes', () => {
    sound.setSfxVolume(0.3);
    sound.play('jump');
    expect(engine.sfx[0].volume).toBeCloseTo(0.3);
  });

  it('setMuted(true) para a música', () => {
    sound.playMusic('bgm_world1');
    sound.setMuted(true);
    expect(engine.stops).toBeGreaterThan(0);
    expect(sound.muted).toBe(true);
  });

  it('setMuted(false) retoma a faixa atual', () => {
    sound.playMusic('bgm_world1');
    sound.setMuted(true);
    const stopsBefore = engine.stops;
    sound.setMuted(false);
    expect(engine.music.length).toBeGreaterThan(1);
    expect(engine.stops).toBe(stopsBefore);
  });

  it('toggleMute alterna o estado', () => {
    expect(sound.toggleMute()).toBe(true);
    expect(sound.muted).toBe(true);
    expect(sound.toggleMute()).toBe(false);
    expect(sound.muted).toBe(false);
  });

  it('persiste volumes em storage', () => {
    const storage = new MemoryStorage();
    const s = new SoundSystem(engine, {}, storage);
    s.setMusicVolume(0.25);
    s.setSfxVolume(0.42);
    expect(storage.data.size).toBe(1);
    const fresh = new SoundSystem(new FakeEngine(), {}, storage);
    expect(fresh.musicVolume).toBeCloseTo(0.25);
    expect(fresh.sfxVolume).toBeCloseTo(0.42);
  });

  it('drainEventLog retorna eventos e limpa', () => {
    sound.play('coin');
    sound.play('jump');
    const log = sound.drainEventLog();
    expect(log).toHaveLength(2);
    expect(log[0].key).toBe('coin');
    expect(sound.drainEventLog()).toHaveLength(0);
  });

  it('NullAudioEngine não lança erros e simula estado retomado', () => {
    const s = new SoundSystem(new NullAudioEngine());
    expect(() => {
      s.play('coin');
      s.playMusic('bgm_world1');
      s.stopMusic();
    }).not.toThrow();
  });
});
