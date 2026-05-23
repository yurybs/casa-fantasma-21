import type { AudioEngine, MusicKey, SfxKey } from './SoundSystem';

interface SfxConfig {
  type: OscillatorType;
  freq: number;
  freqEnd?: number;
  duration: number;
  attack?: number;
  decay?: number;
}

const SFX_CONFIGS: Record<SfxKey, SfxConfig> = {
  jump: { type: 'square', freq: 320, freqEnd: 720, duration: 0.16, attack: 0.005, decay: 0.12 },
  shoot: { type: 'sawtooth', freq: 880, freqEnd: 220, duration: 0.1, attack: 0.002, decay: 0.08 },
  hit: { type: 'square', freq: 200, freqEnd: 80, duration: 0.18, attack: 0.005, decay: 0.16 },
  coin: { type: 'square', freq: 988, freqEnd: 1568, duration: 0.18, attack: 0.005, decay: 0.14 },
  die: { type: 'sawtooth', freq: 440, freqEnd: 80, duration: 0.6, attack: 0.01, decay: 0.5 },
  level_clear: { type: 'square', freq: 523, freqEnd: 1047, duration: 0.6, attack: 0.01, decay: 0.5 },
  power_up: { type: 'square', freq: 440, freqEnd: 1320, duration: 0.4, attack: 0.01, decay: 0.35 },
  enemy_die: { type: 'square', freq: 600, freqEnd: 100, duration: 0.18, attack: 0.005, decay: 0.16 },
};

interface Note {
  freq: number;
  duration: number; // in 8th-note units (0.5=16th, 1=8th, 2=quarter, 4=half)
  rest?: boolean;   // silence for this duration
  type?: OscillatorType; // overrides track waveType
  gain?: number;    // per-note gain multiplier (0–1), default 1
}

interface MusicTrack {
  notes: Note[];
  bpm: number;
  waveType?: OscillatorType;
  /** Master gain multiplier for the whole track (0–1). Softer tracks use lower values. */
  trackGain?: number;
}

// ─── Frequency constants ──────────────────────────────────────────────────────
const R = 1; // placeholder freq for rests (ignored when rest:true)
const C3 = 130.81;
const G3 = 196.00;
const A3 = 220.00;
const B3 = 246.94;
const C4 = 261.63;
const D4 = 293.66;
const E4 = 329.63;
const F4 = 349.23;
const G4 = 392.00;
const A4 = 440.00;
const B4 = 493.88;
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.26;
const F5 = 698.46;
const G5 = 783.99;
const A5 = 880.00;
const B5 = 987.77;
const C6 = 1046.50;
const Bb4 = 466.16;
const D6 = 1174.66;
const Eb5 = 622.25;
const Ab4 = 415.30;

// ─── bgm_world1 — Floresta Encantada (Mundo 1) ───────────────────────────────
// Inspired by SNES Super Mario World overworld: bright, bouncy, triangle-wave
// arpeggios for a soft background feel. BPM 152, key of C major.
// Structure: A – B – A' – C (bass walk) — loops smoothly.
const TRACK_WORLD1: MusicTrack = {
  bpm: 152,
  waveType: 'triangle',
  trackGain: 0.55,
  notes: [
    // ── A Section: playful opening run ───────────────────────────────────
    { freq: E5, duration: 0.5 },
    { freq: R,  duration: 0.5, rest: true },
    { freq: E5, duration: 0.5 },
    { freq: R,  duration: 0.5, rest: true },
    { freq: E5, duration: 0.5 },
    { freq: R,  duration: 0.5, rest: true },
    { freq: C5, duration: 0.5 },
    { freq: E5, duration: 1   },
    { freq: G5, duration: 2   },
    { freq: R,  duration: 1,   rest: true },
    { freq: G4, duration: 2   },
    { freq: R,  duration: 2,   rest: true },

    // ── A2: response phrase (fills the space) ────────────────────────────
    { freq: C5, duration: 1   },
    { freq: G4, duration: 1   },
    { freq: R,  duration: 1,   rest: true },
    { freq: E4, duration: 1   },
    { freq: R,  duration: 1,   rest: true },
    { freq: A4, duration: 1   },
    { freq: B4, duration: 1   },
    { freq: Bb4,duration: 1   },
    { freq: A4, duration: 2   },

    // ── B Section: ascending lyrical line ────────────────────────────────
    { freq: G4, duration: 0.5 },
    { freq: E5, duration: 0.5 },
    { freq: G5, duration: 0.5 },
    { freq: A5, duration: 1   },
    { freq: R,  duration: 0.5, rest: true },
    { freq: F5, duration: 1   },
    { freq: G5, duration: 1   },
    { freq: R,  duration: 1,   rest: true },
    { freq: E5, duration: 1   },
    { freq: R,  duration: 1,   rest: true },
    { freq: C5, duration: 0.5 },
    { freq: D5, duration: 0.5 },
    { freq: B4, duration: 2   },
    { freq: R,  duration: 1,   rest: true },

    // ── B2: chromatic-touch phrase ────────────────────────────────────────
    { freq: G4, duration: 0.5 },
    { freq: A4, duration: 0.5 },
    { freq: C5, duration: 0.5 },
    { freq: D5, duration: 0.5 },
    { freq: E5, duration: 1   },
    { freq: R,  duration: 1,   rest: true },
    { freq: F5, duration: 0.5 },
    { freq: E5, duration: 0.5 },
    { freq: D5, duration: 0.5 },
    { freq: C5, duration: 0.5 },
    { freq: R,  duration: 1,   rest: true },

    // ── C Section: climax + resolution ───────────────────────────────────
    { freq: G5, duration: 0.5 },
    { freq: A5, duration: 0.5 },
    { freq: G5, duration: 0.5 },
    { freq: F5, duration: 0.5 },
    { freq: E5, duration: 1   },
    { freq: R,  duration: 0.5, rest: true },
    { freq: C5, duration: 0.5 },
    { freq: D5, duration: 0.5 },
    { freq: E5, duration: 0.5 },
    { freq: R,  duration: 0.5, rest: true },
    { freq: C5, duration: 2   },
    { freq: R,  duration: 1,   rest: true },

    // ── Bass walk transition (low triangle, softer) — prepares loop ───────
    { freq: C4, duration: 0.5, type: 'triangle', gain: 0.6 },
    { freq: E4, duration: 0.5, type: 'triangle', gain: 0.6 },
    { freq: G4, duration: 0.5, type: 'triangle', gain: 0.6 },
    { freq: C5, duration: 0.5, type: 'triangle', gain: 0.6 },
    { freq: G4, duration: 0.5, type: 'triangle', gain: 0.6 },
    { freq: E4, duration: 0.5, type: 'triangle', gain: 0.6 },
    { freq: C4, duration: 2,   type: 'triangle', gain: 0.6 },
    { freq: R,  duration: 1,   rest: true },
  ],
};

// ─── bgm_world2 — Caverna Assombrada (Mundo 2) ───────────────────────────────
// Dark, moody cave atmosphere. Slower tempo, minor key, sparse melody with
// long sustained notes and deep bass pulses — inspired by SNES Donut Plains /
// Ghost House / cave level soundscapes. BPM 108, key of A minor.
const TRACK_WORLD2: MusicTrack = {
  bpm: 108,
  waveType: 'triangle',
  trackGain: 0.50,
  notes: [
    // ── Intro: deep bass pulse (Am) ───────────────────────────────────────
    { freq: A3, duration: 2,   type: 'sine',     gain: 0.7 },
    { freq: R,  duration: 1,   rest: true },
    { freq: A3, duration: 1,   type: 'sine',     gain: 0.7 },
    { freq: R,  duration: 2,   rest: true },

    // ── A Section: eerie descending melody ───────────────────────────────
    { freq: E5, duration: 2   },
    { freq: D5, duration: 1   },
    { freq: C5, duration: 1   },
    { freq: B4, duration: 2   },
    { freq: R,  duration: 1,   rest: true },
    { freq: A4, duration: 1   },
    { freq: B4, duration: 1   },
    { freq: C5, duration: 2   },
    { freq: R,  duration: 2,   rest: true },

    // ── A2: bass counter-line ─────────────────────────────────────────────
    { freq: A3, duration: 1,   type: 'sine',     gain: 0.65 },
    { freq: C4, duration: 1,   type: 'sine',     gain: 0.65 },
    { freq: E4, duration: 1,   type: 'sine',     gain: 0.65 },
    { freq: A4, duration: 1   },
    { freq: G4, duration: 1   },
    { freq: F4, duration: 1   },
    { freq: E4, duration: 2   },
    { freq: R,  duration: 1,   rest: true },

    // ── B Section: tense chromatic climb ─────────────────────────────────
    { freq: Ab4, duration: 1  },
    { freq: A4,  duration: 1  },
    { freq: Bb4, duration: 1  },
    { freq: B4,  duration: 2  },
    { freq: R,   duration: 1, rest: true },
    { freq: C5,  duration: 1  },
    { freq: B4,  duration: 1  },
    { freq: Bb4, duration: 1  },
    { freq: A4,  duration: 2  },
    { freq: R,   duration: 2, rest: true },

    // ── C Section: haunting high melody ──────────────────────────────────
    { freq: C6, duration: 2   },
    { freq: B5, duration: 1   },
    { freq: A5, duration: 1   },
    { freq: G5, duration: 2   },
    { freq: R,  duration: 1,   rest: true },
    { freq: Eb5,duration: 1   },
    { freq: E5, duration: 1   },
    { freq: A5, duration: 4   },
    { freq: R,  duration: 2,   rest: true },

    // ── Resolution: bass descent back to Am root ──────────────────────────
    { freq: A4, duration: 1   },
    { freq: G4, duration: 1   },
    { freq: F4, duration: 1   },
    { freq: E4, duration: 1   },
    { freq: D4, duration: 1   },
    { freq: C4, duration: 1   },
    { freq: B3, duration: 1,   type: 'sine',     gain: 0.7 },
    { freq: A3, duration: 4,   type: 'sine',     gain: 0.7 },
    { freq: R,  duration: 2,   rest: true },

    // ── Outro pulse (fade to silence before loop) ─────────────────────────
    { freq: A3, duration: 1,   type: 'sine',     gain: 0.5 },
    { freq: R,  duration: 1,   rest: true },
    { freq: G3, duration: 1,   type: 'sine',     gain: 0.4 },
    { freq: R,  duration: 2,   rest: true },
    { freq: C3, duration: 2,   type: 'sine',     gain: 0.35 },
    { freq: R,  duration: 2,   rest: true },
  ],
};

// ─── bgm_world3 — Cidade Abandonada (Mundo 3) ────────────────────────────────
// Driving rhythm, syncopated bass + sparse high melody — inspired by SNES Mega
// Man X stage music: industrial pulse with sawtooth bass and triangle leads.
// Key: D minor, BPM 124. trackGain 0.45 to leave room for boss roars/shockwaves.
const TRACK_WORLD3: MusicTrack = {
  bpm: 124,
  waveType: 'triangle',
  trackGain: 0.45,
  notes: [
    // ── Intro: pulsing bass groove (Dm root) ──────────────────────────────
    { freq: D4, duration: 1,   type: 'sawtooth', gain: 0.45 },
    { freq: D4, duration: 0.5, type: 'sawtooth', gain: 0.45 },
    { freq: R,  duration: 0.5, rest: true },
    { freq: D4, duration: 1,   type: 'sawtooth', gain: 0.45 },
    { freq: F4, duration: 1,   type: 'sawtooth', gain: 0.45 },
    { freq: A4, duration: 2,   type: 'sawtooth', gain: 0.4  },

    // ── A: driving melodic line ───────────────────────────────────────────
    { freq: A5, duration: 0.5 },
    { freq: R,  duration: 0.5, rest: true },
    { freq: A5, duration: 0.5 },
    { freq: F5, duration: 1   },
    { freq: D5, duration: 1   },
    { freq: R,  duration: 0.5, rest: true },
    { freq: C5, duration: 0.5 },
    { freq: D5, duration: 2   },
    { freq: R,  duration: 1,   rest: true },

    // ── A2: bass + lead alternation ───────────────────────────────────────
    { freq: D4, duration: 1,   type: 'sawtooth', gain: 0.45 },
    { freq: F4, duration: 0.5, type: 'sawtooth', gain: 0.45 },
    { freq: A4, duration: 0.5, type: 'sawtooth', gain: 0.45 },
    { freq: A5, duration: 0.5 },
    { freq: G5, duration: 0.5 },
    { freq: F5, duration: 0.5 },
    { freq: A5, duration: 1.5 },
    { freq: R,  duration: 1,   rest: true },

    // ── B: tense climbing phrase ──────────────────────────────────────────
    { freq: D5, duration: 0.5 },
    { freq: E5, duration: 0.5 },
    { freq: F5, duration: 0.5 },
    { freq: G5, duration: 0.5 },
    { freq: A5, duration: 1   },
    { freq: Bb4, duration: 1  },
    { freq: A5, duration: 0.5 },
    { freq: G5, duration: 0.5 },
    { freq: F5, duration: 1   },
    { freq: R,  duration: 1,   rest: true },

    // ── B2: descending response ────────────────────────────────────────────
    { freq: A5, duration: 0.5 },
    { freq: G5, duration: 0.5 },
    { freq: F5, duration: 0.5 },
    { freq: E5, duration: 0.5 },
    { freq: D5, duration: 1   },
    { freq: C5, duration: 0.5 },
    { freq: D5, duration: 0.5 },
    { freq: A4, duration: 2   },
    { freq: R,  duration: 1,   rest: true },

    // ── C: dramatic high climax ───────────────────────────────────────────
    { freq: D6, duration: 0.5 },
    { freq: R,  duration: 0.5, rest: true },
    { freq: D6, duration: 0.5 },
    { freq: C6, duration: 0.5 },
    { freq: A5, duration: 1   },
    { freq: G5, duration: 1   },
    { freq: F5, duration: 2   },
    { freq: R,  duration: 1,   rest: true },

    // ── Bass close + loop bridge ──────────────────────────────────────────
    { freq: A3, duration: 1,   type: 'sawtooth', gain: 0.5 },
    { freq: D4, duration: 1,   type: 'sawtooth', gain: 0.5 },
    { freq: F4, duration: 1,   type: 'sawtooth', gain: 0.45 },
    { freq: A4, duration: 1,   type: 'sawtooth', gain: 0.45 },
    { freq: D5, duration: 2,   type: 'triangle' },
    { freq: R,  duration: 2,   rest: true },
  ],
};

// ─── bgm_menu — Tela de Título ────────────────────────────────────────────────
// Gentle arpeggiated waltz (3/4 feel) — atmospheric, welcoming, SNES-map inspired.
const TRACK_MENU: MusicTrack = {
  bpm: 96,
  waveType: 'triangle',
  trackGain: 1.0,
  notes: [
    { freq: C5, duration: 1   },
    { freq: E5, duration: 1   },
    { freq: G5, duration: 1   },
    { freq: C6, duration: 2   },
    { freq: B5, duration: 1   },
    { freq: G5, duration: 2   },
    { freq: E5, duration: 1   },
    { freq: C5, duration: 2   },
    { freq: R,  duration: 1,   rest: true },

    { freq: A4, duration: 1   },
    { freq: C5, duration: 1   },
    { freq: E5, duration: 1   },
    { freq: A5, duration: 2   },
    { freq: G5, duration: 1   },
    { freq: E5, duration: 2   },
    { freq: C5, duration: 1   },
    { freq: A4, duration: 2   },
    { freq: R,  duration: 1,   rest: true },

    { freq: F4, duration: 1   },
    { freq: A4, duration: 1   },
    { freq: C5, duration: 1   },
    { freq: F5, duration: 2   },
    { freq: E5, duration: 1   },
    { freq: C5, duration: 2   },
    { freq: A4, duration: 1   },
    { freq: F4, duration: 2   },
    { freq: R,  duration: 1,   rest: true },

    { freq: G4, duration: 1   },
    { freq: B4, duration: 1   },
    { freq: D5, duration: 1   },
    { freq: G5, duration: 2   },
    { freq: R,  duration: 1,   rest: true },
    { freq: G4, duration: 1   },
    { freq: B4, duration: 1   },
    { freq: D5, duration: 1   },
    { freq: G5, duration: 1   },
    { freq: F5, duration: 1   },

    { freq: E5, duration: 2   },
    { freq: G5, duration: 0.5, type: 'square', gain: 0.6 },
    { freq: E5, duration: 0.5, type: 'square', gain: 0.6 },
    { freq: C5, duration: 2   },
    { freq: G4, duration: 1   },
    { freq: C5, duration: 4   },
    { freq: R,  duration: 2,   rest: true },
  ],
};

const MUSIC_TRACKS: Record<MusicKey, MusicTrack> = {
  bgm_world1: TRACK_WORLD1,
  bgm_world2: TRACK_WORLD2,
  bgm_world3: TRACK_WORLD3,
  bgm_menu: TRACK_MENU,
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
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, cfg.freqEnd), now + cfg.duration);
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
    const track = MUSIC_TRACKS[key];
    const trackGain = track.trackGain ?? 1.0;
    this.musicGain.gain.setValueAtTime(volume * 0.25 * trackGain, this.ctx.currentTime);
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
      if (!n.rest) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteGain = n.gain ?? 1.0;
        osc.type = n.type ?? track.waveType ?? 'square';
        osc.frequency.setValueAtTime(n.freq, cursor);
        gain.gain.setValueAtTime(0, cursor);
        gain.gain.linearRampToValueAtTime(0.5 * noteGain, cursor + 0.015);
        gain.gain.setValueAtTime(0.5 * noteGain, cursor + dur - 0.05);
        gain.gain.linearRampToValueAtTime(0, cursor + dur - 0.005);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(cursor);
        osc.stop(cursor + dur);
        this.musicScheduled.push(osc);
      }
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
