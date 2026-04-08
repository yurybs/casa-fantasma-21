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

        // Player direction (1 = right, -1 = left)
        this.playerDirection = 1;

        // Collision
        this.physics.add.collider(this.player, this.platforms);

        // Player attack
        this.projectiles = this.physics.add.group();
        this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

        // Spawn boss based on level
        this.spawnBoss();

        // Collision between projectiles and boss
        this.physics.add.overlap(this.projectiles, this.boss, this.hitBoss, null, this);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // GameState
        console.log('Current Level:', GameState.currentLevel);
        console.log('Level1 scene loaded');
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.playerDirection = -1;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.playerDirection = 1;
        } else {
            this.player.setVelocityX(0);
        }


        // Update player visual position
        this.playerVisual.setPosition(this.player.x, this.player.y);
        if (this.spaceKey.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }

        // Player attack
        if (Phaser.Input.Keyboard.JustDown(this.xKey)) {
            console.log('X key pressed');
            this.shootProjectile();
        }

        // Update boss
        if (this.boss && this.boss.isAlive) {
            console.log('Updating boss');
            this.boss.update(this.time.now, this.game.loop.delta);
        }
    }

    spawnBoss() {
        console.log('spawnBoss called, level:', GameState.currentLevel);
        switch (GameState.currentLevel) {
            case 2:
                this.boss = new Ghost(this, 600, 300);
                console.log('Ghost boss spawned at', this.boss.x, this.boss.y);
                break;
            // Add more cases for other levels
            default:
                this.boss = null;
        }
    }

    shootProjectile() {
        console.log('shootProjectile called');
        const projectile = this.add.rectangle(this.player.x, this.player.y, 10, 10, 0xffff00);
        console.log('Created projectile  * this.playerDirection); // Fire in player direction
        projectile.body.setVelocityY(0); // No vertical velocity.player.y);
        this.physics.add.existing(projectile);
        projectile.body.setVelocityX(300); // Always shoot right
        projectile.body.setCollideWorldBounds(true);
        this.projectiles.add(projectile);
        console.log('Added projectile to group');

        // Destroy after 2 seconds
        this.time.delayedCall(2000, () => {
            if (projectile.active) projectile.destroy();
        });
    }

    hitBconsole.log('hitBoss called, boss type:', boss.constructor.name);
        projectile.destroy();
        if (boss && typeof boss.takeDamage === 'function') {
            console.log('Calling takeDamage');
            boss.takeDamage(10); // Damage amount
        } else {
            console.log('boss.takeDamage does not exist or is not a function');
        }
        boss.takeDamage(10); // Damage amount
    }
}