export type SfxKey =
  | 'jump'
  | 'shoot'
  | 'hit'
  | 'coin'
  | 'die'
  | 'level_clear'
  | 'power_up'
  | 'enemy_die';

export type MusicKey = 'bgm_world1' | 'bgm_menu';

export interface AudioEngine {
  playSfx(key: SfxKey, volume: number): void;
  playMusic(key: MusicKey, volume: number, loop: boolean): void;
  stopMusic(): void;
  resume(): Promise<void> | void;
  isResumed(): boolean;
}

export interface SoundSystemOptions {
  musicVolume?: number;
  sfxVolume?: number;
  muted?: boolean;
}

const STORAGE_KEY = 'toy-blaster-kid:sound';

interface PersistedSoundConfig {
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export class SoundSystem {
  private engine: AudioEngine;
  private _musicVolume: number;
  private _sfxVolume: number;
  private _muted: boolean;
  private _currentMusic: MusicKey | null = null;
  private _eventLog: { type: 'sfx' | 'music' | 'stopMusic'; key?: string; volume?: number }[] = [];
  private storage: Pick<Storage, 'getItem' | 'setItem'> | null;

  constructor(
    engine: AudioEngine,
    options: SoundSystemOptions = {},
    storage: Pick<Storage, 'getItem' | 'setItem'> | null = null,
  ) {
    this.engine = engine;
    this.storage = storage;

    const persisted = this.loadPersisted();
    this._musicVolume = clamp01(options.musicVolume ?? persisted?.musicVolume ?? 0.5);
    this._sfxVolume = clamp01(options.sfxVolume ?? persisted?.sfxVolume ?? 0.7);
    this._muted = options.muted ?? persisted?.muted ?? false;
  }

  get musicVolume(): number {
    return this._musicVolume;
  }
  get sfxVolume(): number {
    return this._sfxVolume;
  }
  get muted(): boolean {
    return this._muted;
  }
  get currentMusic(): MusicKey | null {
    return this._currentMusic;
  }

  play(key: SfxKey): void {
    if (this._muted) return;
    if (!this.engine.isResumed()) return;
    const v = this._sfxVolume;
    this._eventLog.push({ type: 'sfx', key, volume: v });
    this.engine.playSfx(key, v);
  }

  playMusic(key: MusicKey): void {
    if (this._currentMusic === key) return;
    this._currentMusic = key;
    if (this._muted) return;
    if (!this.engine.isResumed()) return;
    this._eventLog.push({ type: 'music', key, volume: this._musicVolume });
    this.engine.playMusic(key, this._musicVolume, true);
  }

  stopMusic(): void {
    this._currentMusic = null;
    this._eventLog.push({ type: 'stopMusic' });
    this.engine.stopMusic();
  }

  setMusicVolume(v: number): void {
    this._musicVolume = clamp01(v);
    this.persist();
    if (this._currentMusic && !this._muted && this.engine.isResumed()) {
      this.engine.playMusic(this._currentMusic, this._musicVolume, true);
    }
  }

  setSfxVolume(v: number): void {
    this._sfxVolume = clamp01(v);
    this.persist();
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this.persist();
    if (muted) {
      this.engine.stopMusic();
    } else if (this._currentMusic && this.engine.isResumed()) {
      this.engine.playMusic(this._currentMusic, this._musicVolume, true);
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this._muted);
    return this._muted;
  }

  async resume(): Promise<void> {
    await this.engine.resume();
    if (this._currentMusic && !this._muted) {
      this.engine.playMusic(this._currentMusic, this._musicVolume, true);
    }
  }

  /** Test-only: drains and returns the event log since last call. */
  drainEventLog(): { type: 'sfx' | 'music' | 'stopMusic'; key?: string; volume?: number }[] {
    const log = this._eventLog;
    this._eventLog = [];
    return log;
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      const data: PersistedSoundConfig = {
        musicVolume: this._musicVolume,
        sfxVolume: this._sfxVolume,
        muted: this._muted,
      };
      this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota / serialization errors
    }
  }

  private loadPersisted(): PersistedSoundConfig | null {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<PersistedSoundConfig>;
      if (
        typeof parsed.musicVolume !== 'number' ||
        typeof parsed.sfxVolume !== 'number' ||
        typeof parsed.muted !== 'boolean'
      )
        return null;
      return {
        musicVolume: clamp01(parsed.musicVolume),
        sfxVolume: clamp01(parsed.sfxVolume),
        muted: parsed.muted,
      };
    } catch {
      return null;
    }
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** No-op engine for SSR / tests where no audio is needed. */
export class NullAudioEngine implements AudioEngine {
  playSfx(): void {}
  playMusic(): void {}
  stopMusic(): void {}
  resume(): void {}
  isResumed(): boolean {
    return true;
  }
}
