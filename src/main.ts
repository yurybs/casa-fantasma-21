import Phaser from 'phaser';
import { gameConfig } from './config/GameConfig';
import { SoundSystem } from './systems/SoundSystem';
import { WebAudioEngine } from './systems/WebAudioEngine';

const game = new Phaser.Game(gameConfig);

const sound = new SoundSystem(new WebAudioEngine(), {}, window.localStorage);
game.registry.set('sound', sound);

const resumeOnInteraction = () => {
  void sound.resume();
};
window.addEventListener('pointerdown', resumeOnInteraction, { once: true });
window.addEventListener('keydown', resumeOnInteraction, { once: true });
window.addEventListener('touchstart', resumeOnInteraction, { once: true });

interface GameDebugWindow {
  __sound?: SoundSystem;
}
(window as Window & GameDebugWindow).__sound = sound;
