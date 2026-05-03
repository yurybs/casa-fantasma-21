import Phaser from 'phaser';
import {
  TILE_SIZE,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  ENEMY_SIZE,
  Direction,
  GAME_WIDTH,
  EnemyTag,
} from '../types/GameTypes';
import { LevelData, getLevelByIndex } from '../config/LevelConfig';
import { Player as PlayerLogic } from '../entities/Player';
import { Skeleton as SkeletonLogic, SkeletonProjectile } from '../entities/enemies/Skeleton';
import { Zombie as ZombieLogic } from '../entities/enemies/Zombie';
import { GhostBoss } from '../entities/enemies/GhostBoss';
import { MiniGhost } from '../entities/enemies/MiniGhost';
import { SpiderGhost } from '../entities/enemies/SpiderGhost';
import { FoamGun, Projectile as FoamProjectile } from '../weapons/FoamGun';
import { WaterGun, WaterProjectile } from '../weapons/WaterGun';
import { InputSystem } from '../systems/InputSystem';
import { HUDSystem } from '../systems/HUDSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundSystem, NullAudioEngine } from '../systems/SoundSystem';
import { GameAudioBindings } from '../systems/GameAudioBindings';
import { ParticleEffects } from '../systems/ParticleEffects';
import { TouchControls } from '../ui/TouchControls';
import { fadeIn, fadeToScene } from '../utils/SceneTransition';

type EnemyLogic = SkeletonLogic | ZombieLogic | SpiderGhost | MiniGhost;

interface EnemyEntry {
  logic: EnemyLogic;
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'skeleton' | 'zombie' | 'spider_ghost' | 'mini_ghost';
  tag: EnemyTag;
  hasGravity: boolean;
}

interface BossEntry {
  logic: GhostBoss;
  sprite: Phaser.Physics.Arcade.Sprite;
}

interface ProjectileSprite {
  sprite: Phaser.Physics.Arcade.Sprite;
  data: FoamProjectile | WaterProjectile;
  isWater: boolean;
}

interface BoneSprite {
  sprite: Phaser.Physics.Arcade.Sprite;
  ttlMs: number;
  damage: number;
}

interface CheckpointSprite {
  sprite: Phaser.Physics.Arcade.Sprite;
  x: number;
  y: number;
  active: boolean;
}

interface PowerUpSprite {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'water_gun';
}

interface GameSceneInitData {
  levelIndex?: number;
}

export class GameScene extends Phaser.Scene {
  private level!: LevelData;
  private levelIndex: number = 1;
  private playerLogic!: PlayerLogic;
  private playerSprite!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private platformsPassthrough!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: EnemyEntry[] = [];
  private boss?: BossEntry;
  private foamGun!: FoamGun;
  private waterGun!: WaterGun;
  private projectiles: ProjectileSprite[] = [];
  private bones: BoneSprite[] = [];
  private coinSprites: Phaser.Physics.Arcade.Sprite[] = [];
  private flagSprite?: Phaser.Physics.Arcade.Sprite;
  private checkpoints: CheckpointSprite[] = [];
  private powerUps: PowerUpSprite[] = [];
  private inputs!: InputSystem;
  private hud!: HUDSystem;
  private save!: SaveSystem;
  private gameSound!: SoundSystem;
  private audio!: GameAudioBindings;
  private particles!: ParticleEffects;
  private touch?: TouchControls;
  private timeRemaining: number = 0;
  private gameEnded: boolean = false;
  private testHooks: Record<string, unknown> = {};
  private animTimerMs: number = 0;
  private playerLandSpeed: number = 0;
  private hasWaterGun: boolean = false;
  private respawnX: number = 0;
  private respawnY: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneInitData): void {
    this.levelIndex = data?.levelIndex ?? 1;
    this.level = getLevelByIndex(this.levelIndex);
    this.gameEnded = false;
    this.enemies = [];
    this.boss = undefined;
    this.projectiles = [];
    this.bones = [];
    this.coinSprites = [];
    this.checkpoints = [];
    this.powerUps = [];
  }

  create(): void {
    fadeIn(this);
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
    const saveData = this.save.load();
    this.hasWaterGun = saveData.powerUps.waterGun;

    this.foamGun = new FoamGun();
    this.waterGun = new WaterGun();
    this.inputs = new InputSystem(this);
    this.hud = new HUDSystem(this);
    this.gameSound =
      (this.registry.get('sound') as SoundSystem | undefined) ??
      new SoundSystem(new NullAudioEngine());
    this.audio = new GameAudioBindings(this.gameSound);
    this.particles = new ParticleEffects(this);

    this.drawBackground();
    this.buildPlatforms();
    this.spawnPlayer();
    this.spawnEnemies();
    this.spawnBoss();
    this.spawnCoins();
    this.spawnFlag();
    this.spawnCheckpoints();
    this.spawnPowerUps();
    this.setupCollisions();
    this.hud.create();

    this.timeRemaining = this.level.timeLimit;

    this.cameras.main.startFollow(this.playerSprite, true, 0.15, 0.15);

    this.touch = new TouchControls(this, this.inputs);
    this.touch.create();

    void this.gameSound.resume().then(() => this.gameSound.playMusic('bgm_world1'));

    this.inputs.read();

    this.exposeTestHooks();
  }

  private drawBackground(): void {
    const w = this.level.widthInTiles * TILE_SIZE;
    const groundY = (this.level.heightInTiles - 1) * TILE_SIZE;
    const positions = [80, 280, 460, 660, 880, 1080, 1240];
    for (const x of positions) {
      if (x > w) break;
      this.add.image(x, 80 + (x % 60), 'cloud').setAlpha(0.7).setScrollFactor(0.3);
    }
    const treePositions = [120, 400, 760, 1100, 1320];
    for (const x of treePositions) {
      if (x > w) break;
      this.add.image(x, groundY - 28, 'tree').setScrollFactor(0.7).setDepth(0);
    }
    const bushPositions = [60, 200, 360, 540, 700, 860, 1020, 1180, 1340];
    for (const x of bushPositions) {
      if (x > w) break;
      this.add.image(x, groundY + 8, 'bush').setScrollFactor(0.85).setDepth(0);
    }
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

  private resolveSpawn(): { x: number; y: number } {
    const cp = this.save.getCheckpoint();
    if (cp && cp.levelIndex === this.levelIndex) {
      return { x: cp.x, y: cp.y };
    }
    return this.level.playerSpawn;
  }

  private spawnPlayer(): void {
    this.playerLogic = new PlayerLogic({
      onGameOver: () => this.endGame('gameover'),
      onLifeLost: (lives) => {
        if (lives > 0) {
          this.respawnPlayer();
        }
      },
      onDamage: () => {
        this.audio.emit('player.hit');
        this.particles.damageFlash(this.playerSprite);
      },
      onDeath: () => this.audio.emit('player.die'),
      onCoinCollected: () => this.audio.emit('player.coin'),
      onExtraLife: () => this.audio.emit('player.power_up'),
    });

    const spawn = this.resolveSpawn();
    this.respawnX = spawn.x;
    this.respawnY = spawn.y;

    this.playerSprite = this.physics.add.sprite(spawn.x, spawn.y, 'player');
    this.playerSprite.setDisplaySize(PLAYER_WIDTH, PLAYER_HEIGHT);
    this.playerSprite.setCollideWorldBounds(true);
    this.playerSprite.setMaxVelocity(this.playerLogic.getStats().moveSpeed, 600);
    (this.playerSprite.body as Phaser.Physics.Arcade.Body).setSize(20, 44).setOffset(6, 2);
  }

  private respawnPlayer(): void {
    this.playerLogic.respawn();
    this.playerSprite.setPosition(this.respawnX, this.respawnY);
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
        this.enemies.push({ logic, sprite, type: 'skeleton', tag: 'normal', hasGravity: true });
      } else if (e.type === 'zombie') {
        const logic = new ZombieLogic();
        const sprite = this.physics.add.sprite(e.x, e.y, 'zombie');
        sprite.setDisplaySize(ENEMY_SIZE, ENEMY_SIZE);
        sprite.setCollideWorldBounds(true);
        sprite.setMaxVelocity(60, 600);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'zombie', tag: 'normal', hasGravity: true });
      } else if (e.type === 'spider_ghost') {
        const logic = new SpiderGhost(e.y);
        const sprite = this.physics.add.sprite(e.x, e.y, 'spider_ghost');
        sprite.setDisplaySize(ENEMY_SIZE, ENEMY_SIZE);
        (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'spider_ghost', tag: 'ghost', hasGravity: false });
      } else if (e.type === 'mini_ghost') {
        const logic = new MiniGhost();
        const sprite = this.physics.add.sprite(e.x, e.y, 'mini_ghost');
        sprite.setDisplaySize(24, 24);
        (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'mini_ghost', tag: 'ghost', hasGravity: false });
      }
    }
  }

  private spawnBoss(): void {
    if (!this.level.boss) return;
    if (this.level.boss.type === 'ghost') {
      const logic = new GhostBoss(this.level.boss.x, this.level.boss.y, {
        onSpawnMinis: (spawns) => {
          for (const s of spawns) this.spawnMiniGhost(s.x, s.y);
        },
      });
      const sprite = this.physics.add.sprite(this.level.boss.x, this.level.boss.y, 'ghost_boss');
      sprite.setDisplaySize(60, 60);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      logic.setPosition(this.level.boss.x, this.level.boss.y);
      this.boss = { logic, sprite };
    }
  }

  private spawnMiniGhost(x: number, y: number): void {
    const logic = new MiniGhost();
    logic.setPosition(x, y);
    const sprite = this.physics.add.sprite(x, y, 'mini_ghost');
    sprite.setDisplaySize(24, 24);
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.enemies.push({ logic, sprite, type: 'mini_ghost', tag: 'ghost', hasGravity: false });
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
    if (!this.level.flagPos) return;
    this.flagSprite = this.physics.add.sprite(this.level.flagPos.x, this.level.flagPos.y, 'flag');
    this.flagSprite.setDisplaySize(24, 36);
    (this.flagSprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  private spawnCheckpoints(): void {
    const activeCp = this.save.getCheckpoint();
    for (const cp of this.level.checkpoints) {
      const isActive =
        !!activeCp &&
        activeCp.levelIndex === this.levelIndex &&
        Math.abs(activeCp.x - cp.x) < 1 &&
        Math.abs(activeCp.y - cp.y) < 1;
      const tex = isActive ? 'checkpoint_flag_active' : 'checkpoint_flag';
      const sprite = this.physics.add.sprite(cp.x, cp.y, tex);
      sprite.setDisplaySize(24, 36);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.checkpoints.push({ sprite, x: cp.x, y: cp.y, active: isActive });
    }
  }

  private spawnPowerUps(): void {
    for (const p of this.level.powerUps) {
      if (p.type === 'water_gun' && this.hasWaterGun) continue;
      const sprite = this.physics.add.sprite(p.x, p.y, 'water_gun_pickup');
      sprite.setDisplaySize(28, 24);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.powerUps.push({ sprite, type: p.type });
    }
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.playerSprite, this.platforms);
    this.physics.add.collider(this.playerSprite, this.platformsPassthrough);

    this.enemies.forEach((e) => {
      if (!e.hasGravity) return;
      this.physics.add.collider(e.sprite, this.platforms);
      this.physics.add.collider(e.sprite, this.platformsPassthrough);
    });

    this.physics.add.overlap(this.playerSprite, this.coinSprites, (_p, coin) => {
      const coinSprite = coin as Phaser.Physics.Arcade.Sprite;
      this.particles.coinSparkle(coinSprite.x, coinSprite.y);
      this.playerLogic.collectCoin();
      coinSprite.destroy();
      this.coinSprites = this.coinSprites.filter((c) => c !== coinSprite);
    });

    if (this.flagSprite) {
      this.physics.add.overlap(this.playerSprite, this.flagSprite, () => this.endGame('victory'));
    }
  }

  private spawnBone(proj: SkeletonProjectile): void {
    const sprite = this.physics.add.sprite(proj.x, proj.y, 'projectile_bone');
    sprite.setDisplaySize(8, 8);
    sprite.setVelocity(proj.vx, proj.vy);
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.bones.push({ sprite, ttlMs: 3000, damage: 1 });
  }

  private spawnFoamProjectile(x: number, y: number, facing: Direction): void {
    if (this.hasWaterGun) {
      const data = this.waterGun.fire(x, y, facing);
      if (!data) return;
      const sprite = this.physics.add.sprite(x, y, 'projectile_water');
      sprite.setDisplaySize(12, 12);
      sprite.setVelocity(data.vx, data.vy);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.projectiles.push({ sprite, data, isWater: true });
      this.audio.emit('player.shoot');
    } else {
      const data = this.foamGun.fire(x, y, facing);
      if (!data) return;
      const sprite = this.physics.add.sprite(x, y, 'projectile_foam');
      sprite.setDisplaySize(10, 10);
      sprite.setVelocity(data.vx, data.vy);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.projectiles.push({ sprite, data, isWater: false });
      this.audio.emit('player.shoot');
    }
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
    this.handleBoss(delta);
    this.handleProjectiles(delta);
    this.handleEnemyContacts();
    this.handleBossContact();
    this.handleCheckpointContacts();
    this.handlePowerUpContacts();

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

    this.animTimerMs += delta;
    this.updatePlayerAnimation();
    this.updateEnemyAnimations();
    this.updateBossAnimation();
    this.updateCoinAnimation();

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
      if (this.playerLandSpeed > 280) {
        this.particles.landingDust(this.playerSprite.x, this.playerSprite.y + 22);
      }
      this.playerLandSpeed = 0;
    } else if (!onGround && this.playerLogic.isOnGround) {
      this.playerLogic.leaveGround();
    }
    if (!onGround) {
      this.playerLandSpeed = Math.max(this.playerLandSpeed, body.velocity.y);
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
        this.audio.emit('player.jump');
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
      if (e.hasGravity) {
        e.logic.isOnGround = body.blocked.down || body.touching.down;
      }
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
      if (!e.hasGravity) {
        e.sprite.setVelocityY(e.logic.vy);
      }
      e.sprite.setFlipX(e.logic.facing === Direction.Left);

      if (e.logic.isDead) {
        e.sprite.destroy();
      }
    }
    this.enemies = this.enemies.filter((e) => !e.logic.isDead);
  }

  private handleBoss(delta: number): void {
    if (!this.boss) return;
    const b = this.boss;
    b.logic.x = b.sprite.x;
    b.logic.y = b.sprite.y;
    b.logic.update(delta, this.playerSprite.x, this.playerSprite.y);
    b.sprite.setVelocity(b.logic.vx, b.logic.vy);
    b.sprite.setFlipX(b.logic.facing === Direction.Left);
    if (b.logic.isDead) {
      this.particles.enemyDeath(b.sprite.x, b.sprite.y);
      this.audio.emit('enemy.die');
      b.sprite.destroy();
      this.boss = undefined;
      this.endGame('victory');
    }
  }

  private handleProjectiles(delta: number): void {
    this.foamGun.update(delta);
    this.waterGun.update(delta);
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
            const dmg = this.computeDamage(p, e.tag);
            e.logic.takeDamage(dmg);
            if (e.logic.isDead) {
              this.particles.enemyDeath(e.sprite.x, e.sprite.y);
              this.audio.emit('enemy.die');
            }
            dead = true;
            break;
          }
        }
      }

      if (!dead && this.boss) {
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(
            p.sprite.getBounds(),
            this.boss.sprite.getBounds(),
          )
        ) {
          const dmg = this.computeDamage(p, 'ghost');
          this.boss.logic.takeDamage(dmg);
          dead = true;
        }
      }

      if (dead) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      } else if (this.projectiles[i]) {
        this.particles.projectileTrail(p.sprite.x, p.sprite.y);
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

  private computeDamage(p: ProjectileSprite, tag: EnemyTag): number {
    if (p.isWater) {
      return WaterGun.damageFor(p.data as WaterProjectile, tag);
    }
    return p.data.damage;
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
        if (wasJumpingDown && e.tag === 'normal') {
          e.logic.takeDamage(99);
          this.playerSprite.setVelocityY(-300);
          if (e.logic.isDead) {
            this.particles.enemyDeath(e.sprite.x, e.sprite.y);
            this.audio.emit('enemy.die');
          }
        } else {
          this.playerLogic.takeDamage(e.logic.damage);
        }
      }
    }
  }

  private handleBossContact(): void {
    if (!this.boss) return;
    if (
      Phaser.Geom.Intersects.RectangleToRectangle(
        this.playerSprite.getBounds(),
        this.boss.sprite.getBounds(),
      )
    ) {
      this.playerLogic.takeDamage(this.boss.logic.damage);
    }
  }

  private handleCheckpointContacts(): void {
    for (const cp of this.checkpoints) {
      if (cp.active) continue;
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          this.playerSprite.getBounds(),
          cp.sprite.getBounds(),
        )
      ) {
        cp.active = true;
        cp.sprite.setTexture('checkpoint_flag_active');
        this.respawnX = cp.x;
        this.respawnY = cp.y;
        this.save.setCheckpoint(this.levelIndex, cp.x, cp.y);
        this.audio.emit('player.power_up');
      }
    }
  }

  private handlePowerUpContacts(): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          this.playerSprite.getBounds(),
          p.sprite.getBounds(),
        )
      ) {
        if (p.type === 'water_gun') {
          this.hasWaterGun = true;
          this.save.setPowerUp('waterGun', true);
        }
        this.audio.emit('player.power_up');
        this.particles.coinSparkle(p.sprite.x, p.sprite.y);
        p.sprite.destroy();
        this.powerUps.splice(i, 1);
      }
    }
  }

  private endGame(reason: 'victory' | 'gameover'): void {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.gameSound.stopMusic();
    if (reason === 'victory') {
      this.audio.emit('level.complete');
      const data = this.save.markLevelComplete(this.level.id - 1);
      data.coins = this.playerLogic.coins;
      this.save.save(data);
      fadeToScene(this, 'LevelCompleteScene', {
        levelId: this.level.id,
        levelIndex: this.levelIndex,
        coins: this.playerLogic.coins,
        timeBonus: Math.floor(this.timeRemaining),
      });
    } else {
      fadeToScene(this, 'GameOverScene', { coins: this.playerLogic.coins });
    }
  }

  private updatePlayerAnimation(): void {
    if (!this.playerLogic.isOnGround) {
      this.playerSprite.setTexture('player_jump');
    } else if (Math.abs(this.playerLogic.vx) > 30) {
      const useRun = Math.floor(this.animTimerMs / 120) % 2 === 0;
      this.playerSprite.setTexture(useRun ? 'player_run' : 'player');
    } else {
      this.playerSprite.setTexture('player');
    }
  }

  private updateEnemyAnimations(): void {
    const flip = Math.floor(this.animTimerMs / 200) % 2 === 0;
    for (const e of this.enemies) {
      if (e.type === 'spider_ghost' || e.type === 'mini_ghost') continue;
      const moving = Math.abs(e.logic.vx) > 5;
      const base = e.type === 'skeleton' ? 'skeleton' : 'zombie';
      const walk = `${base}_walk`;
      e.sprite.setTexture(moving && flip ? walk : base);
    }
  }

  private updateBossAnimation(): void {
    if (!this.boss) return;
    const tex = this.boss.logic.phase === 'phase2' ? 'ghost_boss_phase2' : 'ghost_boss';
    this.boss.sprite.setTexture(tex);
    const bob = Math.sin(this.animTimerMs / 220) * 2;
    this.boss.sprite.setOffset?.(0, bob);
  }

  private updateCoinAnimation(): void {
    const frame = Math.floor(this.animTimerMs / 180) % 2 === 0 ? 'coin' : 'coin_1';
    for (const c of this.coinSprites) c.setTexture(frame);
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
      getSoundEvents: () => this.gameSound.drainEventLog(),
      getMusicVolume: () => this.gameSound.musicVolume,
      getSfxVolume: () => this.gameSound.sfxVolume,
      getMuted: () => this.gameSound.muted,
      pressVirtualKey: (code: string) => this.inputs.virtualKeyDown(code),
      releaseVirtualKey: (code: string) => this.inputs.virtualKeyUp(code),
      isTouchEnabled: () => this.touch?.enabled ?? false,
      getDelta: () => this.game.loop.delta,
      getFps: () => this.game.loop.actualFps,
      getLevelIndex: () => this.levelIndex,
      getLevelId: () => this.level.id,
      hasBoss: () => !!this.boss,
      getBossHp: () => this.boss?.logic.hp ?? 0,
      getBossPhase: () => this.boss?.logic.phase ?? 'none',
      damageBoss: (n: number) => this.boss?.logic.takeDamage(n),
      getMiniGhostCount: () =>
        this.enemies.filter((e) => e.type === 'mini_ghost').length,
      hasWaterGun: () => this.hasWaterGun,
      grantWaterGun: () => {
        this.hasWaterGun = true;
        this.save.setPowerUp('waterGun', true);
      },
      getPowerUpCount: () => this.powerUps.length,
      getCheckpointCount: () => this.checkpoints.length,
      getActiveCheckpointCount: () =>
        this.checkpoints.filter((c) => c.active).length,
      getRespawnX: () => this.respawnX,
      getRespawnY: () => this.respawnY,
      getSavedCheckpoint: () => this.save.getCheckpoint(),
      forceFireProjectile: () =>
        this.spawnFoamProjectile(
          this.playerSprite.x + (this.playerLogic.facing === Direction.Right ? 16 : -16),
          this.playerSprite.y,
          this.playerLogic.facing,
        ),
    };
    (window as unknown as { __game: Record<string, unknown> }).__game = this.testHooks;
  }
}
