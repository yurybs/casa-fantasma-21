import Enemy from './Enemy.js';

export default class Boss extends Enemy {
    constructor(scene, x, y, texture = null, health = 50, damage = 5) {
        super(scene, x, y, texture, health, damage);
        this.maxHealth = health;

        // Health bar
        this.healthBarBg = scene.add.rectangle(400, 20, 400, 20, 0x000000);
        this.healthBar = scene.add.rectangle(400, 20, 400, 20, 0xff0000);
        this.healthBar.setOrigin(0.5);
        this.healthBarBg.setOrigin(0.5);
        this.updateHealthBar();
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        this.updateHealthBar();
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.width = 400 * healthPercent;
        if (this.health <= 0) {
            this.healthBarBg.destroy();
            this.healthBar.destroy();
        }
    }

    destroy() {
        super.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBar) this.healthBar.destroy();
    }
}