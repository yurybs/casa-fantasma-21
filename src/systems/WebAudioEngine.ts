import type { AudioEngine, MusicKey, SfxKey } from './SoundSystem';

interface SfxConfig {
  type: OscillatorType;
  freq: number;
  freqEnd?: number;
  duration: number;
  sweepDurationRatio?: number;
  attack?: number;
  decay?: number;
  noise?: boolean;
}

const SFX_CONFIGS: Record<SfxKey, SfxConfig> = {
  jump: { type: 'square', freq: 320, freqEnd: 720, duration: 0.16, attack: 0.005, decay: 0.12 },
  shoot: { type: 'sawtooth', freq: 880, freqEnd: 220, duration: 0.1, attack: 0.002, decay: 0.08 },
  hit: { type: 'square', freq: 200, freqEnd: 80, duration: 0.18, attack: 0.005, decay: 0.16 },
  coin: { type: 'square', freq: 988, freqEnd: 1568, duration: 0.18, attack: 0.005, decay: 0.14 },
  die: { type: 'sawtooth', freq: 440, freqEnd: 80, duration: 0.6, attack: 0.01, decay: 0.5 },
  level_clear: {
    type: 'square',
    freq: 523,
    freqEnd: 1047,
    duration: 0.6,
    attack: 0.01,
    decay: 0.5,
  },
  power_up: { type: 'square', freq: 440, freqEnd: 1320, duration: 0.4, attack: 0.01, decay: 0.35 },
  enemy_die: { type: 'square', freq: 600, freqEnd: 100, duration: 0.18, attack: 0.005, decay: 0.16 },
};

interface MusicTrack {
  notes: { freq: number; duration: number }[];
  bpm: number;
}

const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.26;
const F5 = 698.46;
const G5 = 783.99;
const A5 = 880.0;
const B5 = 987.77;
const C6 = 1046.5;

const MUSIC_TRACKS: Record<MusicKey, MusicTrack> = {
  bgm_world1: {
    bpm: 130,
    notes: [
      { freq: C5, duration: 1 },
      { freq: E5, duration: 1 },
      { freq: G5, duration: 1 },
      { freq: C6, duration: 1 },
      { freq: B5, duration: 1 },
      { freq: G5, duration: 1 },
      { freq: E5, duration: 1 },
      { freq: D5, duration: 1 },
      { freq: F5, duration: 1 },
      { freq: A5, duration: 1 },
      { freq: C6, duration: 1 },
      { freq: B5, duration: 1 },
      { freq: A5, duration: 1 },
      { freq: G5, duration: 1 },
      { freq: E5, duration: 1 },
      { freq: C5, duration: 2 },
    ],
  },
  bgm_menu: {
    bpm: 100,
    notes: [
      { freq: E5, duration: 2 },
      { freq: G5, duration: 1 },
      { freq: C6, duration: 1 },
      { freq: B5, duration: 2 },
      { freq: G5, duration: 1 },
      { freq: E5, duration: 1 },
      { freq: F5, duration: 2 },
      { freq: A5, duration: 1 },
      { freq: C6, duration: 1 },
      { freq: G5, duration: 4 },
    ],
  },
};

export class WebAudioEngine implements AudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private resumed = false;
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private musicScheduled: AudioScheduledSourceNode[] = [];

  constructor(private readonly audioContextFactory: () => AudioContext = defaultAudioContextFactory) {}

  isResumed(): boolean {
    return this.resumed;
  }

  async resume(): Promise<void> {
    if (this.resumed) return;
    if (!this.ctx) {
      try {
        this.ctx = this.audioContextFactory();
        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.ctx.destination);
      } catch {
        return;
      }
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // ignore
      }
    }
    this.resumed = this.ctx.state === 'running';
  }

  playSfx(key: SfxKey, volume: number): void {
    if (!this.ctx || !this.sfxGain || !this.resumed) return;
    const cfg = SFX_CONFIGS[key];
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.freq, now);
    if (cfg.freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, cfg.freqEnd),
        now + cfg.duration,
      );
    }
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.6, now + (cfg.attack ?? 0.005));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + cfg.duration + 0.05);
  }

  playMusic(key: MusicKey, volume: number, loop: boolean): void {
    if (!this.ctx || !this.musicGain || !this.resumed) return;
    this.stopMusic();
    this.musicGain.gain.setValueAtTime(volume * 0.25, this.ctx.currentTime);
    this.scheduleTrack(key, loop);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    for (const s of this.musicScheduled) {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    }
    this.musicScheduled = [];
  }

  private scheduleTrack(key: MusicKey, loop: boolean): void {
    if (!this.ctx || !this.musicGain) return;
    const track = MUSIC_TRACKS[key];
    const beat = 60 / track.bpm;
    const eighthNote = beat / 2;
    let cursor = this.ctx.currentTime + 0.02;

    for (const n of track.notes) {
      const dur = n.duration * eighthNote;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.freq, cursor);
      gain.gain.setValueAtTime(0, cursor);
      gain.gain.linearRampToValueAtTime(0.5, cursor + 0.01);
      gain.gain.setValueAtTime(0.5, cursor + dur - 0.04);
      gain.gain.linearRampToValueAtTime(0, cursor + dur - 0.005);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(cursor);
      osc.stop(cursor + dur);
      this.musicScheduled.push(osc);
      cursor += dur;
    }

    if (loop) {
      const totalMs = (cursor - this.ctx.currentTime) * 1000;
      this.musicTimer = setTimeout(() => this.scheduleTrack(key, loop), Math.max(50, totalMs - 50));
    }
  }
}

function defaultAudioContextFactory(): AudioContext {
  type WindowWithAudio = typeof window & { webkitAudioContext?: typeof AudioContext };
  const W = window as WindowWithAudio;
  const Ctor = W.AudioContext || W.webkitAudioContext;
  if (!Ctor) throw new Error('AudioContext not supported');
  return new Ctor();
}
