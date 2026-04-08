import Boss from './Boss.js';

export default class Ghost extends Boss {
    constructor(scene, x, y) {
        super(scene, x, y, null, 30, 3); // Health 30, damage 3
        this.setDisplaySize(40, 40);
        this.setTint(0x888888); // Gray for ghost
        this.body.setAllowGravity(false); // Floats, ignores gravity
        this.body.setImmovable(false); // Can move through platforms? Wait, for passing through, need to disable collision or something.

        // For passing through platforms, we can set collision or use overlap, but for simplicity, make it not collide with platforms.
        // Actually, in Phaser, to pass through, don't add collider with platforms.

        this.initialY = y;
        this.timeAlive = 0;
    }

    update(time, delta) {
        this.timeAlive += delta;

        // Sine wave up and down
        this.y = this.initialY + Math.sin(this.timeAlive * 0.002) * 50;

        // Slowly pursue player
        const player = this.scene.player;
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 10) {
                this.x += (dx / distance) * 0.5; // Slow speed
                this.y += (dy / distance) * 0.5;
            }
        }

        // Update visual position
        if (this.visual) {
            this.visual.setPosition(this.x, this.y);
        }
        console.log('Ghost update called, position:', this.x, this.y);
    }
}