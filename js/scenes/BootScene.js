export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Any boot assets if needed
    }

    create() {
        this.scene.start('PreloadScene');
    }
}