import { SfxKey, SoundSystem } from './SoundSystem';

/**
 * Maps high-level game events to SFX keys. Used by both runtime (GameScene)
 * and integration tests, so that wiring is verified once.
 */
export type GameEvent =
  | 'player.jump'
  | 'player.shoot'
  | 'player.hit'
  | 'player.die'
  | 'player.coin'
  | 'player.power_up'
  | 'enemy.die'
  | 'level.complete';

export const EVENT_TO_SFX: Record<GameEvent, SfxKey> = {
  'player.jump': 'jump',
  'player.shoot': 'shoot',
  'player.hit': 'hit',
  'player.die': 'die',
  'player.coin': 'coin',
  'player.power_up': 'power_up',
  'enemy.die': 'enemy_die',
  'level.complete': 'level_clear',
};

export class GameAudioBindings {
  constructor(private readonly sound: SoundSystem) {}

  emit(event: GameEvent): void {
    const sfx = EVENT_TO_SFX[event];
    if (sfx) this.sound.play(sfx);
  }
}
