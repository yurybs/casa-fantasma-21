export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture = null, health = 10, damage = 1) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.health = health;
        this.damage = damage;
        this.isAlive = true;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isAlive = false;
            this.destroy();
            return;
        }

        // Flicker effect: tint white for 200ms
        this.setTint(0xffffff);
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });
    }

    update() {
        // Override in subclasses
    }
}