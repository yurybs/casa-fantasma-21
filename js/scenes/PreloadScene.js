export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Load assets here
        // For now, nothing
    }

    create() {
        this.scene.start('Level1');
    }
}