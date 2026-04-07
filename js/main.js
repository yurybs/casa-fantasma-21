import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import Level1 from './scenes/Level1.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, Level1]
};

const game = new Phaser.Game(config);