import GameState from '../GameState.js';

export default class Level1 extends Phaser.Scene {
    constructor() {
        super('Level1');
    }

    create() {
        // Create platforms
        this.platforms = this.physics.add.staticGroup();

        // Ground
        this.platforms.create(400, 568, null).setDisplaySize(800, 32).refreshBody();
        this.add.rectangle(400, 568, 800, 32, 0x00ff00);

        // Platforms
        this.platforms.create(600, 400, null).setDisplaySize(200, 32).refreshBody();
        this.add.rectangle(600, 400, 200, 32, 0x00ff00);

        this.platforms.create(50, 250, null).setDisplaySize(100, 32).refreshBody();
        this.add.rectangle(50, 250, 100, 32, 0x00ff00);

        this.platforms.create(750, 220, null).setDisplaySize(100, 32).refreshBody();
        this.add.rectangle(750, 220, 100, 32, 0x00ff00);

        // Player
        this.player = this.physics.add.sprite(100, 450, null);
        this.player.setDisplaySize(32, 32);
        this.player.setTint(0xff0000);
        this.player.setCollideWorldBounds(true);

        // Collision
        this.physics.add.collider(this.player, this.platforms);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // GameState
        console.log('Current Level:', GameState.currentLevel);

        // TODO: In Level 2, spawn Boss Fantasma here
        // const bossFantasma = new BossFantasma(this, x, y);
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.spaceKey.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }
}