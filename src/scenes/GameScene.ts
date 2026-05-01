import Phaser from 'phaser';
import {
  TILE_SIZE,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  ENEMY_SIZE,
  Direction,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '../types/GameTypes';
import { LEVEL_1, LevelData } from '../config/LevelConfig';
import { Player as PlayerLogic } from '../entities/Player';
import { Skeleton as SkeletonLogic, SkeletonProjectile } from '../entities/enemies/Skeleton';
import { Zombie as ZombieLogic } from '../entities/enemies/Zombie';
import { FoamGun, Projectile as FoamProjectile } from '../weapons/FoamGun';
import { InputSystem } from '../systems/InputSystem';
import { HUDSystem } from '../systems/HUDSystem';
import { SaveSystem } from '../systems/SaveSystem';

interface EnemyEntry {
  logic: SkeletonLogic | ZombieLogic;
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'skeleton' | 'zombie';
}

interface ProjectileSprite {
  sprite: Phaser.Physics.Arcade.Sprite;
  data: FoamProjectile;
}

interface BoneSprite {
  sprite: Phaser.Physics.Arcade.Sprite;
  ttlMs: number;
  damage: number;
}

export class GameScene extends Phaser.Scene {
  private level!: LevelData;
  private playerLogic!: PlayerLogic;
  private playerSprite!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private platformsPassthrough!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: EnemyEntry[] = [];
  private foamGun!: FoamGun;
  private projectiles: ProjectileSprite[] = [];
  private bones: BoneSprite[] = [];
  private coinSprites: Phaser.Physics.Arcade.Sprite[] = [];
  private flagSprite!: Phaser.Physics.Arcade.Sprite;
  private inputs!: InputSystem;
  private hud!: HUDSystem;
  private save!: SaveSystem;
  private timeRemaining: number = 0;
  private gameEnded: boolean = false;
  private testHooks: Record<string, unknown> = {};

  constructor() {
    super({ key: 'GameScene' });
  }

  init(_data: { levelIndex?: number }): void {
    this.level = LEVEL_1;
    this.gameEnded = false;
    this.enemies = [];
    this.projectiles = [];
    this.bones = [];
    this.coinSprites = [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.level.backgroundColor);
    this.physics.world.setBounds(
      0,
      0,
      this.level.widthInTiles * TILE_SIZE,
      this.level.heightInTiles * TILE_SIZE,
    );
    this.cameras.main.setBounds(
      0,
      0,
      this.level.widthInTiles * TILE_SIZE,
      this.level.heightInTiles * TILE_SIZE,
    );

    this.save = new SaveSystem();
    this.foamGun = new FoamGun();
    this.inputs = new InputSystem(this);
    this.hud = new HUDSystem(this);

    this.buildPlatforms();
    this.spawnPlayer();
    this.spawnEnemies();
    this.spawnCoins();
    this.spawnFlag();
    this.setupCollisions();
    this.hud.create();

    this.timeRemaining = this.level.timeLimit;

    this.cameras.main.startFollow(this.playerSprite, true, 0.15, 0.15);

    this.inputs.read();

    this.exposeTestHooks();
  }

  private buildPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    this.platformsPassthrough = this.physics.add.staticGroup();
    for (let y = 0; y < this.level.heightInTiles; y++) {
      for (let x = 0; x < this.level.widthInTiles; x++) {
        const tile = this.level.tiles[y][x];
        if (tile === 0) continue;
        const wx = x * TILE_SIZE + TILE_SIZE / 2;
        const wy = y * TILE_SIZE + TILE_SIZE / 2;
        const key = tile === 1 ? 'tile_ground' : 'tile_platform';
        const sprite = this.add.image(wx, wy, key);
        const group = tile === 1 ? this.platforms : this.platformsPassthrough;
        const body = group.create(wx, wy, key) as Phaser.Physics.Arcade.Sprite;
        body.setVisible(false);
        body.refreshBody();
        sprite.setDepth(1);
        if (tile === 2) {
          (body.body as Phaser.Physics.Arcade.StaticBody).checkCollision.down = false;
          (body.body as Phaser.Physics.Arcade.StaticBody).checkCollision.left = false;
          (body.body as Phaser.Physics.Arcade.StaticBody).checkCollision.right = false;
        }
      }
    }
  }

  private spawnPlayer(): void {
    this.playerLogic = new PlayerLogic({
      onGameOver: () => this.endGame('gameover'),
      onLifeLost: (lives) => {
        if (lives > 0) {
          this.respawnPlayer();
        }
      },
    });

    this.playerSprite = this.physics.add.sprite(
      this.level.playerSpawn.x,
      this.level.playerSpawn.y,
      'player',
    );
    this.playerSprite.setDisplaySize(PLAYER_WIDTH, PLAYER_HEIGHT);
    this.playerSprite.setCollideWorldBounds(true);
    this.playerSprite.setMaxVelocity(this.playerLogic.getStats().moveSpeed, 600);
    (this.playerSprite.body as Phaser.Physics.Arcade.Body).setSize(20, 44).setOffset(6, 2);
  }

  private respawnPlayer(): void {
    this.playerLogic.respawn();
    this.playerSprite.setPosition(this.level.playerSpawn.x, this.level.playerSpawn.y);
    this.playerSprite.setVelocity(0, 0);
  }

  private spawnEnemies(): void {
    for (const e of this.level.enemies) {
      if (e.type === 'skeleton') {
        const logic = new SkeletonLogic({
          onShoot: (proj) => this.spawnBone(proj),
          onDeath: () => {},
        });
        const sprite = this.physics.add.sprite(e.x, e.y, 'skeleton');
        sprite.setDisplaySize(ENEMY_SIZE, ENEMY_SIZE);
        sprite.setCollideWorldBounds(true);
        sprite.setMaxVelocity(80, 600);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'skeleton' });
      } else {
        const logic = new ZombieLogic();
        const sprite = this.physics.add.sprite(e.x, e.y, 'zombie');
        sprite.setDisplaySize(ENEMY_SIZE, ENEMY_SIZE);
        sprite.setCollideWorldBounds(true);
        sprite.setMaxVelocity(60, 600);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'zombie' });
      }
    }
  }

  private spawnCoins(): void {
    for (const c of this.level.coins) {
      const sprite = this.physics.add.sprite(c.x, c.y, 'coin');
      sprite.setDisplaySize(12, 12);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.coinSprites.push(sprite);
    }
  }

  private spawnFlag(): void {
    this.flagSprite = this.physics.add.sprite(this.level.flagPos.x, this.level.flagPos.y, 'flag');
    this.flagSprite.setDisplaySize(24, 36);
    (this.flagSprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.playerSprite, this.platforms);
    this.physics.add.collider(this.playerSprite, this.platformsPassthrough);

    this.enemies.forEach((e) => {
      this.physics.add.collider(e.sprite, this.platforms);
      this.physics.add.collider(e.sprite, this.platformsPassthrough);
    });

    this.physics.add.overlap(this.playerSprite, this.coinSprites, (_p, coin) => {
      const coinSprite = coin as Phaser.Physics.Arcade.Sprite;
      this.playerLogic.collectCoin();
      coinSprite.destroy();
      this.coinSprites = this.coinSprites.filter((c) => c !== coinSprite);
    });

    this.physics.add.overlap(this.playerSprite, this.flagSprite, () => this.endGame('victory'));
  }

  private spawnBone(proj: SkeletonProjectile): void {
    const sprite = this.physics.add.sprite(proj.x, proj.y, 'projectile_bone');
    sprite.setDisplaySize(8, 8);
    sprite.setVelocity(proj.vx, proj.vy);
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.bones.push({ sprite, ttlMs: 3000, damage: 1 });
  }

  private spawnFoamProjectile(x: number, y: number, facing: Direction): void {
    const data = this.foamGun.fire(x, y, facing);
    if (!data) return;
    const sprite = this.physics.add.sprite(x, y, 'projectile_foam');
    sprite.setDisplaySize(10, 10);
    sprite.setVelocity(data.vx, data.vy);
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.projectiles.push({ sprite, data });
  }

  update(_time: number, delta: number): void {
    if (this.gameEnded) return;

    const inp = this.inputs.read();
    if (inp.pausePressed) {
      this.scene.pause();
      this.scene.launch('PauseScene', { from: 'GameScene' });
      return;
    }

    this.handlePlayer(inp, delta);
    this.handleEnemies(delta);
    this.handleProjectiles(delta);
    this.handleEnemyContacts();

    this.timeRemaining = Math.max(0, this.timeRemaining - delta / 1000);
    if (this.timeRemaining <= 0 && !this.gameEnded) {
      this.playerLogic.takeDamage(this.playerLogic.maxHp);
    }

    this.hud.update({
      hp: this.playerLogic.hp,
      maxHp: this.playerLogic.maxHp,
      lives: this.playerLogic.lives,
      coins: this.playerLogic.coins,
      timeRemaining: this.timeRemaining,
    });

    this.playerLogic.setFacing(this.playerLogic.facing);
    this.playerSprite.setFlipX(this.playerLogic.facing === Direction.Left);

    if (this.playerLogic.isInvincible) {
      const blink = Math.floor(this.time.now / 100) % 2 === 0;
      this.playerSprite.setAlpha(blink ? 0.4 : 1);
    } else {
      this.playerSprite.setAlpha(1);
    }
  }

  private handlePlayer(inp: ReturnType<InputSystem['read']>, delta: number): void {
    const body = this.playerSprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround && !this.playerLogic.isOnGround) {
      this.playerLogic.landOnGround();
    } else if (!onGround && this.playerLogic.isOnGround) {
      this.playerLogic.leaveGround();
    }

    let dir: Direction | 0 = 0;
    if (inp.left && !inp.right) dir = Direction.Left;
    else if (inp.right && !inp.left) dir = Direction.Right;

    this.playerLogic.moveHorizontal(dir, delta);
    this.playerSprite.setVelocityX(this.playerLogic.vx);

    if (inp.jumpPressed) {
      const jumped = this.playerLogic.startJump();
      if (jumped) {
        this.playerSprite.setVelocityY(this.playerLogic.vy);
      }
    }
    if (inp.jumpDown) {
      this.playerLogic.holdJump(delta);
      if (this.playerLogic.isHoldingJump) {
        this.playerSprite.setVelocityY(this.playerLogic.vy);
      }
    }
    if (inp.jumpReleased) {
      this.playerLogic.releaseJump();
    }
    if (inp.shootPressed && this.playerLogic.canShoot()) {
      this.spawnFoamProjectile(
        this.playerSprite.x + (this.playerLogic.facing === Direction.Right ? 16 : -16),
        this.playerSprite.y,
        this.playerLogic.facing,
      );
    }

    this.playerLogic.update(delta);
  }

  private handleEnemies(delta: number): void {
    for (const e of this.enemies) {
      e.logic.x = e.sprite.x;
      e.logic.y = e.sprite.y;
      const body = e.sprite.body as Phaser.Physics.Arcade.Body;
      e.logic.isOnGround = body.blocked.down || body.touching.down;
      e.logic.update(delta, this.playerSprite.x, this.playerSprite.y);

      if (e.type === 'skeleton') {
        const blockedSide =
          (e.logic.facing === Direction.Left && body.blocked.left) ||
          (e.logic.facing === Direction.Right && body.blocked.right);
        if (blockedSide) {
          (e.logic as SkeletonLogic).reportEdge(true);
        }
      }

      e.sprite.setVelocityX(e.logic.vx);
      e.sprite.setFlipX(e.logic.facing === Direction.Left);

      if (e.logic.isDead) {
        e.sprite.destroy();
      }
    }
    this.enemies = this.enemies.filter((e) => !e.logic.isDead);
  }

  private handleProjectiles(delta: number): void {
    this.foamGun.update(delta);
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.data.x = p.sprite.x;
      p.data.y = p.sprite.y;
      p.data.ttlMs -= delta;
      const offscreen =
        p.sprite.x < this.cameras.main.scrollX - 50 ||
        p.sprite.x > this.cameras.main.scrollX + GAME_WIDTH + 50 ||
        p.sprite.y < -50 ||
        p.sprite.y > this.level.heightInTiles * TILE_SIZE + 50;
      let dead = !p.data.alive || p.data.ttlMs <= 0 || offscreen;

      if (!dead) {
        for (const e of this.enemies) {
          if (
            Phaser.Geom.Intersects.RectangleToRectangle(
              p.sprite.getBounds(),
              e.sprite.getBounds(),
            )
          ) {
            e.logic.takeDamage(p.data.damage);
            dead = true;
            break;
          }
        }
      }

      if (dead) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.bones.length - 1; i >= 0; i--) {
      const b = this.bones[i];
      b.ttlMs -= delta;
      if (
        b.ttlMs <= 0 ||
        b.sprite.x < this.cameras.main.scrollX - 50 ||
        b.sprite.x > this.cameras.main.scrollX + GAME_WIDTH + 50
      ) {
        b.sprite.destroy();
        this.bones.splice(i, 1);
        continue;
      }
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          b.sprite.getBounds(),
          this.playerSprite.getBounds(),
        )
      ) {
        this.playerLogic.takeDamage(b.damage);
        b.sprite.destroy();
        this.bones.splice(i, 1);
      }
    }
  }

  private handleEnemyContacts(): void {
    for (const e of this.enemies) {
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          this.playerSprite.getBounds(),
          e.sprite.getBounds(),
        )
      ) {
        const playerBody = this.playerSprite.body as Phaser.Physics.Arcade.Body;
        const wasJumpingDown =
          playerBody.velocity.y > 0 &&
          this.playerSprite.y < e.sprite.y - 8 &&
          !this.playerLogic.isInvincible;
        if (wasJumpingDown) {
          e.logic.takeDamage(99);
          this.playerSprite.setVelocityY(-300);
        } else {
          this.playerLogic.takeDamage(e.logic.damage);
        }
      }
    }
  }

  private endGame(reason: 'victory' | 'gameover'): void {
    if (this.gameEnded) return;
    this.gameEnded = true;
    if (reason === 'victory') {
      const data = this.save.markLevelComplete(this.level.id - 1);
      data.coins = this.playerLogic.coins;
      this.save.save(data);
      this.scene.start('LevelCompleteScene', {
        levelId: this.level.id,
        coins: this.playerLogic.coins,
        timeBonus: Math.floor(this.timeRemaining),
      });
    } else {
      this.scene.start('GameOverScene', { coins: this.playerLogic.coins });
    }
  }

  private exposeTestHooks(): void {
    this.testHooks = {
      getPlayerHp: () => this.playerLogic.hp,
      getPlayerLives: () => this.playerLogic.lives,
      getCoins: () => this.playerLogic.coins,
      getEnemyCount: () => this.enemies.length,
      getProjectileCount: () => this.projectiles.length,
      getPlayerX: () => this.playerSprite.x,
      getPlayerY: () => this.playerSprite.y,
      getPlayerVx: () => this.playerLogic.vx,
      getPlayerVy: () => this.playerLogic.vy,
      isPlayerOnGround: () => this.playerLogic.isOnGround,
      teleportPlayer: (x: number, y: number) => this.playerSprite.setPosition(x, y),
      damagePlayer: (n: number) => this.playerLogic.takeDamage(n),
      getTimeRemaining: () => this.timeRemaining,
      isGameEnded: () => this.gameEnded,
      forceGameOver: () => {
        this.playerLogic.lives = 0;
        this.endGame('gameover');
      },
      forceVictory: () => this.endGame('victory'),
      getActiveSceneKey: () => {
        const active = this.scene.manager.getScenes(true);
        return active.length > 0 ? active[active.length - 1].scene.key : '';
      },
    };
    (window as unknown as { __game: Record<string, unknown> }).__game = this.testHooks;
  }
}
