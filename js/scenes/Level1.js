import GameState from '../GameState.js';
import Ghost from '../classes/Ghost.js';

export default class Level1 extends Phaser.Scene {
    constructor() {
        super('Level1');
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue

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

        // Player visual (since sprite has no texture)
        this.playerVisual = this.add.rectangle(this.player.x, this.player.y, 32, 32, 0xff0000);

        // Collision
        this.physics.add.collider(this.player, this.platforms);

        // Player attack
        this.projectiles = this.physics.add.group();
        this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

        // Spawn boss based on level
        this.spawnBoss();

        // Collision between projectiles and boss
        this.physics.add.overlap(this.projectiles, this.boss, this.hitBoss, null, this);
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }


        // Update player visual position
        this.playerVisual.setPosition(this.player.x, this.player.y);
        if (this.spaceKey.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    spawnBoss() {
        switch (GameState.currentLevel) {
            case 2:
                this.boss = new Ghost(this, 600, 300);
                break;
            // Add more cases for other levels
            default:
                this.boss = null;
        }
    }

    shootProjectile() {
        const projectile = this.projectiles.create(this.player.x, this.player.y, null);
        projectile.setDisplaySize(10, 10);
        projectile.setTint(0xffff00); // Yellow star
        projectile.setVelocityX(this.player.flipX ? -300 : 300); // Direction based on player facing? For now, right.

        // Destroy after 2 seconds
        this.time.delayedCall(2000, () => {
            if (projectile.active) projectile.destroy();
        });
    }

    hitBoss(projectile, boss) {
        projectile.destroy();
        boss.takeDamage(10); // Damage amount
    }
}