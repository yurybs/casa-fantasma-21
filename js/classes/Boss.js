import Enemy from './Enemy.js';

export default class Boss extends Enemy {
    constructor(scene, x, y, texture = null, health = 50, damage = 5) {
        super(scene, x, y, texture, health, damage);
        this.maxHealth = health;

        // Visual (since no texture)
        this.visual = scene.add.rectangle(x, y, 40, 40, 0xff0000); // Default red, override in subclasses

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
            if (this.visual) this.visual.destroy();
        }
    }

    destroy() {
        super.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.visual) this.visual.destroy();
    }
}