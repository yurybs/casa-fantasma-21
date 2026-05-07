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
import { FireGhost } from '../entities/enemies/FireGhost';
import { Crow } from '../entities/enemies/Crow';
import { ClownBoss } from '../entities/enemies/ClownBoss';
import { ScarecrowBoss } from '../entities/enemies/ScarecrowBoss';
import { MiniClown } from '../entities/enemies/MiniClown';
import { MiniScarecrow } from '../entities/enemies/MiniScarecrow';
import { FoamGun, Projectile as FoamProjectile } from '../weapons/FoamGun';
import { WaterGun, WaterProjectile } from '../weapons/WaterGun';
import { InputSystem } from '../systems/InputSystem';
import { HUDSystem } from '../systems/HUDSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundSystem, NullAudioEngine } from '../systems/SoundSystem';
import { GameAudioBindings } from '../systems/GameAudioBindings';
import { ParticleEffects } from '../systems/ParticleEffects';
import { ScreenConfusion } from '../systems/ScreenConfusion';
import { TouchControls } from '../ui/TouchControls';
import { fadeIn, fadeToScene } from '../utils/SceneTransition';

type EnemyKind =
  | 'skeleton'
  | 'zombie'
  | 'spider_ghost'
  | 'mini_ghost'
  | 'fire_ghost'
  | 'crow'
  | 'mini_clown'
  | 'mini_scarecrow';

type EnemyLogic =
  | SkeletonLogic
  | ZombieLogic
  | SpiderGhost
  | MiniGhost
  | FireGhost
  | Crow
  | MiniClown
  | MiniScarecrow;

interface EnemyEntry {
  logic: EnemyLogic;
  sprite: Phaser.Physics.Arcade.Sprite;
  type: EnemyKind;
  tag: EnemyTag;
  hasGravity: boolean;
}

type BossLogic = GhostBoss | ClownBoss | ScarecrowBoss;
type BossKind = 'ghost' | 'clown' | 'scarecrow';

interface BossEntry {
  logic: BossLogic;
  sprite: Phaser.Physics.Arcade.Sprite;
  kind: BossKind;
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

interface JuggleBallSprite {
  sprite: Phaser.Physics.Arcade.Sprite;
  ttlMs: number;
  damage: number;
}

interface FireTrailSprite {
  sprite: Phaser.GameObjects.Image;
  ttlMs: number;
  x: number;
  y: number;
}

interface CheckpointSprite {
  sprite: Phaser.Physics.Arcade.Sprite;
  x: number;
  y: number;
  active: boolean;
}

type PowerUpKind = 'water_gun' | 'star' | 'extra_heart';

interface PowerUpSprite {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: PowerUpKind;
}

interface GameSceneInitData {
  levelIndex?: number;
}

const FIRE_TRAIL_TTL_MS = 1500;
const JUGGLE_BALL_TTL_MS = 3000;
const JUGGLE_BALL_GRAVITY = 800;

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
  private juggleBalls: JuggleBallSprite[] = [];
  private fireTrails: FireTrailSprite[] = [];
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
  private confusion!: ScreenConfusion;
  private touch?: TouchControls;
  private timeRemaining: number = 0;
  private gameEnded: boolean = false;
  private testHooks: Record<string, unknown> = {};
  private animTimerMs: number = 0;
  private playerLandSpeed: number = 0;
  private hasWaterGun: boolean = false;
  private respawnX: number = 0;
  private respawnY: number = 0;
  private armHitbox?: Phaser.GameObjects.Rectangle;

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
    this.juggleBalls = [];
    this.fireTrails = [];
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
    this.confusion = new ScreenConfusion(this);

    this.drawBackground();
    this.buildPlatforms();
    this.spawnPlayer(saveData.powerUps.extraHearts);
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

    this.events.once('shutdown', () => this.confusion.stop());
    this.exposeTestHooks();
  }

  private drawBackground(): void {
    const w = this.level.widthInTiles * TILE_SIZE;
    const groundY = (this.level.heightInTiles - 1) * TILE_SIZE;
    if (this.level.theme === 'cave') {
      const stalactiteCount = Math.floor(w / 80);
      for (let i = 0; i < stalactiteCount; i++) {
        const x = 40 + i * 80 + ((i * 13) % 30);
        if (this.textures.exists('stalactite')) {
          this.add.image(x, 18, 'stalactite').setAlpha(0.85).setScrollFactor(0.5).setDepth(0);
        }
      }
      return;
    }

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
    const groundKey = this.level.theme === 'cave' ? 'tile_cave_ground' : 'tile_ground';
    const platKey = this.level.theme === 'cave' ? 'tile_cave_platform' : 'tile_platform';
    for (let y = 0; y < this.level.heightInTiles; y++) {
      for (let x = 0; x < this.level.widthInTiles; x++) {
        const tile = this.level.tiles[y][x];
        if (tile === 0) continue;
        const wx = x * TILE_SIZE + TILE_SIZE / 2;
        const wy = y * TILE_SIZE + TILE_SIZE / 2;
        const key = tile === 1 ? groundKey : platKey;
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

  private spawnPlayer(savedExtraHearts: number): void {
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

    for (let i = 0; i < savedExtraHearts; i++) this.playerLogic.addExtraHeart();

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
        const logic = new SkeletonLogic({ onShoot: (proj) => this.spawnBone(proj) });
        const sprite = this.makeGroundSprite(e.x, e.y, 'skeleton', 80);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'skeleton', tag: 'normal', hasGravity: true });
      } else if (e.type === 'zombie') {
        const logic = new ZombieLogic();
        const sprite = this.makeGroundSprite(e.x, e.y, 'zombie', 60);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'zombie', tag: 'normal', hasGravity: true });
      } else if (e.type === 'spider_ghost') {
        const logic = new SpiderGhost(e.y);
        const sprite = this.makeFlyingSprite(e.x, e.y, 'spider_ghost', ENEMY_SIZE);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'spider_ghost', tag: 'ghost', hasGravity: false });
      } else if (e.type === 'mini_ghost') {
        const logic = new MiniGhost();
        const sprite = this.makeFlyingSprite(e.x, e.y, 'mini_ghost', 24);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'mini_ghost', tag: 'ghost', hasGravity: false });
      } else if (e.type === 'fire_ghost') {
        const logic = new FireGhost(e.x, e.y, {
          onDropTrail: (drop) => this.spawnFireTrail(drop.x, drop.y),
        });
        const sprite = this.makeFlyingSprite(e.x, e.y, 'fire_ghost', ENEMY_SIZE);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'fire_ghost', tag: 'ghost', hasGravity: false });
      } else if (e.type === 'crow') {
        const logic = new Crow(e.x, e.y);
        const sprite = this.makeFlyingSprite(e.x, e.y, 'crow', 28);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'crow', tag: 'normal', hasGravity: false });
      } else if (e.type === 'mini_clown') {
        const logic = new MiniClown();
        const sprite = this.makeGroundSprite(e.x, e.y, 'mini_clown', 100);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'mini_clown', tag: 'normal', hasGravity: true });
      } else if (e.type === 'mini_scarecrow') {
        const logic = new MiniScarecrow();
        const sprite = this.makeGroundSprite(e.x, e.y, 'mini_scarecrow', 60);
        logic.setPosition(e.x, e.y);
        this.enemies.push({ logic, sprite, type: 'mini_scarecrow', tag: 'normal', hasGravity: true });
      }
    }
  }

  private makeGroundSprite(x: number, y: number, key: string, maxSpeed: number): Phaser.Physics.Arcade.Sprite {
    const sprite = this.physics.add.sprite(x, y, key);
    sprite.setDisplaySize(ENEMY_SIZE, ENEMY_SIZE);
    sprite.setCollideWorldBounds(true);
    sprite.setMaxVelocity(maxSpeed, 600);
    return sprite;
  }

  private makeFlyingSprite(x: number, y: number, key: string, size: number): Phaser.Physics.Arcade.Sprite {
    const sprite = this.physics.add.sprite(x, y, key);
    sprite.setDisplaySize(size, size);
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    return sprite;
  }

  private spawnBoss(): void {
    if (!this.level.boss) return;
    const b = this.level.boss;
    if (b.type === 'ghost') {
      const logic = new GhostBoss(b.x, b.y, {
        onSpawnMinis: (spawns) => spawns.forEach((s) => this.spawnMiniGhost(s.x, s.y)),
      });
      const sprite = this.makeFlyingSprite(b.x, b.y, 'ghost_boss', 60);
      logic.setPosition(b.x, b.y);
      this.boss = { logic, sprite, kind: 'ghost' };
    } else if (b.type === 'clown') {
      const logic = new ClownBoss(b.x, b.y, {
        onJuggleThrow: (balls) =>
          balls.forEach((ball) => this.spawnJuggleBall(ball.x, ball.y, ball.vx, ball.vy)),
        onSpawnMiniClowns: (spawns) =>
          spawns.forEach((s) => this.spawnMiniClown(s.x, s.y)),
        onConfusionStart: () => this.confusion.start(),
        onConfusionEnd: () => this.confusion.stop(),
      });
      const sprite = this.physics.add.sprite(b.x, b.y, 'clown_boss');
      sprite.setDisplaySize(60, 60);
      sprite.setCollideWorldBounds(true);
      sprite.setMaxVelocity(180, 600);
      logic.setPosition(b.x, b.y);
      this.boss = { logic, sprite, kind: 'clown' };
    } else if (b.type === 'scarecrow') {
      const logic = new ScarecrowBoss(b.x, b.y, {
        onSpawnCrows: (spawns) =>
          spawns.forEach((s) => this.spawnCrowEnemy(s.x, s.y, s.direction)),
      });
      const sprite = this.makeFlyingSprite(b.x, b.y, 'scarecrow_boss', 64);
      sprite.setDepth(2);
      logic.setPosition(b.x, b.y);
      this.boss = { logic, sprite, kind: 'scarecrow' };
      this.armHitbox = this.add.rectangle(b.x, b.y, 4, 14, 0xffaa44, 0.6).setDepth(2);
      this.armHitbox.setVisible(false);
    }
  }

  private spawnMiniGhost(x: number, y: number): void {
    const logic = new MiniGhost();
    logic.setPosition(x, y);
    const sprite = this.makeFlyingSprite(x, y, 'mini_ghost', 24);
    this.enemies.push({ logic, sprite, type: 'mini_ghost', tag: 'ghost', hasGravity: false });
  }

  private spawnMiniClown(x: number, y: number): void {
    const logic = new MiniClown();
    logic.setPosition(x, y);
    const sprite = this.makeGroundSprite(x, y, 'mini_clown', 110);
    this.physics.add.collider(sprite, this.platforms);
    this.physics.add.collider(sprite, this.platformsPassthrough);
    this.enemies.push({ logic, sprite, type: 'mini_clown', tag: 'normal', hasGravity: true });
  }

  private spawnCrowEnemy(x: number, y: number, dir: Direction): void {
    const logic = new Crow(x, y, dir);
    const sprite = this.makeFlyingSprite(x, y, 'crow', 28);
    this.enemies.push({ logic, sprite, type: 'crow', tag: 'normal', hasGravity: false });
  }

  private spawnJuggleBall(x: number, y: number, vx: number, vy: number): void {
    const sprite = this.physics.add.sprite(x, y, 'juggle_ball');
    sprite.setDisplaySize(14, 14);
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    sprite.setVelocity(vx, vy);
    this.juggleBalls.push({ sprite, ttlMs: JUGGLE_BALL_TTL_MS, damage: 1 });
  }

  private spawnFireTrail(x: number, y: number): void {
    const sprite = this.add.image(x, y, 'fire_trail').setDepth(1);
    sprite.setScale(1);
    this.fireTrails.push({ sprite, ttlMs: FIRE_TRAIL_TTL_MS, x, y });
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
      const tex =
        p.type === 'water_gun' ? 'water_gun_pickup'
        : p.type === 'star' ? 'star_pickup'
        : 'extra_heart_pickup';
      const sprite = this.physics.add.sprite(p.x, p.y, tex);
      const size = p.type === 'water_gun' ? 28 : p.type === 'star' ? 26 : 26;
      sprite.setDisplaySize(size, size);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.powerUps.push({ sprite, type: p.type as PowerUpKind });
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

    if (this.boss?.kind === 'clown') {
      this.physics.add.collider(this.boss.sprite, this.platforms);
      this.physics.add.collider(this.boss.sprite, this.platformsPassthrough);
    }

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
    this.handleJuggleBalls(delta);
    this.handleFireTrails(delta);
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
    this.updateStarVisual();

    if (this.playerLogic.isInvincible && !this.playerLogic.hasStar) {
      const blink = Math.floor(this.time.now / 100) % 2 === 0;
      this.playerSprite.setAlpha(blink ? 0.4 : 1);
    } else if (!this.playerLogic.hasStar) {
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

  /** Returns true when there is no solid ground directly under the probe point. */
  private isPitAhead(sprite: Phaser.Physics.Arcade.Sprite, facing: Direction): boolean {
    const halfW = ENEMY_SIZE / 2;
    const halfH = ENEMY_SIZE / 2;
    // Probe one tile-width beyond the leading edge, at foot level.
    const probeX =
      facing === Direction.Right
        ? sprite.x + halfW + TILE_SIZE
        : sprite.x - halfW - TILE_SIZE;
    const probeY = sprite.y + halfH + 2; // just below feet
    const tileX = Math.floor(probeX / TILE_SIZE);
    const tileY = Math.floor(probeY / TILE_SIZE);
    if (tileY < 0 || tileY >= this.level.heightInTiles) return true;
    if (tileX < 0 || tileX >= this.level.widthInTiles) return true;
    return (this.level.tiles[tileY]?.[tileX] ?? 0) === 0;
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
        // Pit avoidance: flip and immediately reverse vx so the sprite
        // doesn't step into the gap this frame.
        if (e.logic.isOnGround && !blockedSide && this.isPitAhead(e.sprite, e.logic.facing)) {
          (e.logic as SkeletonLogic).reportEdge(true);
          e.logic.vx = -e.logic.vx;
        }
      }

      if (e.type === 'zombie' && e.logic.isOnGround && e.logic.vx !== 0) {
        if (this.isPitAhead(e.sprite, e.logic.facing)) {
          e.logic.vx = 0;
        }
      }

      e.sprite.setVelocityX(e.logic.vx);
      if (!e.hasGravity) {
        e.sprite.setVelocityY(e.logic.vy);
      } else if (e.type === 'mini_clown' && e.logic.vy < 0) {
        // Hop initiated this frame — pass it through to physics.
        e.sprite.setVelocityY(e.logic.vy);
        e.logic.vy = 0;
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
    if (b.kind === 'ghost' || b.kind === 'scarecrow') {
      b.sprite.setVelocity(b.logic.vx, b.logic.vy);
    } else if (b.kind === 'clown') {
      // Clown uses gravity normally (it's a ground-based boss with hops).
      b.sprite.setVelocityX(b.logic.vx);
      if ((b.logic as ClownBoss).state === 'jumping' && b.logic.vy < 0) {
        b.sprite.setVelocityY(b.logic.vy);
      }
    }
    b.sprite.setFlipX(b.logic.facing === Direction.Left);

    if (b.kind === 'scarecrow') {
      this.updateScarecrowArmHitbox(b.logic as ScarecrowBoss);
    }

    if (b.logic.isDead) {
      this.particles.enemyDeath(b.sprite.x, b.sprite.y);
      this.audio.emit('enemy.die');
      b.sprite.destroy();
      this.armHitbox?.destroy();
      this.armHitbox = undefined;
      this.confusion.stop();
      this.boss = undefined;
      this.endGame('victory');
    }
  }

  private updateScarecrowArmHitbox(boss: ScarecrowBoss): void {
    if (!this.armHitbox) return;
    const len = boss.getArmHitboxLength();
    if (len <= 0) {
      this.armHitbox.setVisible(false);
      return;
    }
    const dirSign = boss.armDirection === Direction.Left ? -1 : 1;
    this.armHitbox.setVisible(true);
    this.armHitbox.width = len;
    this.armHitbox.height = 14;
    this.armHitbox.setSize(len, 14);
    this.armHitbox.setPosition(boss.x + (dirSign * len) / 2, boss.y - 8);
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
          const bossTag: EnemyTag = this.boss.kind === 'ghost' ? 'ghost' : 'normal';
          const dmg = this.computeDamage(p, bossTag);
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

  private handleJuggleBalls(delta: number): void {
    const dt = delta / 1000;
    for (let i = this.juggleBalls.length - 1; i >= 0; i--) {
      const j = this.juggleBalls[i];
      const body = j.sprite.body as Phaser.Physics.Arcade.Body;
      body.velocity.y += JUGGLE_BALL_GRAVITY * dt;
      j.ttlMs -= delta;
      const onGround = j.sprite.y > (this.level.heightInTiles - 2) * TILE_SIZE;
      if (j.ttlMs <= 0 || onGround) {
        j.sprite.destroy();
        this.juggleBalls.splice(i, 1);
        continue;
      }
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          j.sprite.getBounds(),
          this.playerSprite.getBounds(),
        )
      ) {
        this.playerLogic.takeDamage(j.damage);
        j.sprite.destroy();
        this.juggleBalls.splice(i, 1);
      }
    }
  }

  private handleFireTrails(delta: number): void {
    for (let i = this.fireTrails.length - 1; i >= 0; i--) {
      const f = this.fireTrails[i];
      f.ttlMs -= delta;
      f.sprite.setAlpha(Math.max(0, f.ttlMs / FIRE_TRAIL_TTL_MS));
      if (f.ttlMs <= 0) {
        f.sprite.destroy();
        this.fireTrails.splice(i, 1);
        continue;
      }
      const dx = this.playerSprite.x - f.x;
      const dy = this.playerSprite.y - f.y;
      if (dx * dx + dy * dy < 16 * 16) {
        this.playerLogic.takeDamage(1);
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
        if (this.playerLogic.hasStar) {
          e.logic.takeDamage(99);
          if (e.logic.isDead) {
            this.particles.enemyDeath(e.sprite.x, e.sprite.y);
            this.audio.emit('enemy.die');
          }
          continue;
        }
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
      if (this.playerLogic.hasStar) {
        this.boss.logic.takeDamage(1);
      } else {
        this.playerLogic.takeDamage(this.boss.logic.damage);
      }
    }
    if (this.armHitbox && this.armHitbox.visible) {
      const armBounds = this.armHitbox.getBounds();
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(armBounds, this.playerSprite.getBounds())
      ) {
        this.playerLogic.takeDamage(1);
      }
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
        } else if (p.type === 'star') {
          this.playerLogic.activateStar();
        } else if (p.type === 'extra_heart') {
          this.playerLogic.addExtraHeart();
          this.save.addExtraHeart();
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
    this.confusion.stop();
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

  private updateStarVisual(): void {
    if (this.playerLogic.hasStar) {
      const cycle = Math.floor(this.animTimerMs / 80) % 6;
      const tints = [0xffe600, 0xff66cc, 0x66ddff, 0x88ff88, 0xff8800, 0xffffff];
      this.playerSprite.setTint(tints[cycle]);
    } else {
      this.playerSprite.clearTint();
    }
  }

  private updateEnemyAnimations(): void {
    const flip = Math.floor(this.animTimerMs / 200) % 2 === 0;
    for (const e of this.enemies) {
      if (e.type === 'spider_ghost' || e.type === 'mini_ghost' || e.type === 'fire_ghost' || e.type === 'crow') continue;
      const moving = Math.abs(e.logic.vx) > 5;
      if (e.type === 'skeleton' || e.type === 'zombie') {
        const base = e.type;
        const walk = `${base}_walk`;
        e.sprite.setTexture(moving && flip ? walk : base);
      }
    }
  }

  private updateBossAnimation(): void {
    if (!this.boss) return;
    const b = this.boss;
    if (b.kind === 'ghost') {
      const tex = (b.logic as GhostBoss).phase === 'phase2' ? 'ghost_boss_phase2' : 'ghost_boss';
      b.sprite.setTexture(tex);
    } else if (b.kind === 'clown') {
      const tex = (b.logic as ClownBoss).phase === 'phase2' ? 'clown_boss_phase2' : 'clown_boss';
      b.sprite.setTexture(tex);
    } else if (b.kind === 'scarecrow') {
      const sb = b.logic as ScarecrowBoss;
      const tex = sb.phase === 'phase2' ? 'scarecrow_boss_phase2' : 'scarecrow_boss';
      b.sprite.setTexture(tex);
      if (sb.isRotating) {
        b.sprite.rotation += 0.18;
      } else {
        b.sprite.rotation = 0;
      }
    }
  }

  private updateCoinAnimation(): void {
    const frame = Math.floor(this.animTimerMs / 180) % 2 === 0 ? 'coin' : 'coin_1';
    for (const c of this.coinSprites) c.setTexture(frame);
  }

  private exposeTestHooks(): void {
    this.testHooks = {
      getPlayerHp: () => this.playerLogic.hp,
      getPlayerMaxHp: () => this.playerLogic.maxHp,
      getPlayerLives: () => this.playerLogic.lives,
      getCoins: () => this.playerLogic.coins,
      getEnemyCount: () => this.enemies.length,
      getEnemyKinds: () => this.enemies.map((e) => e.type),
      getProjectileCount: () => this.projectiles.length,
      getJuggleBallCount: () => this.juggleBalls.length,
      getFireTrailCount: () => this.fireTrails.length,
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
      getLevelTheme: () => this.level.theme,
      hasBoss: () => !!this.boss,
      getBossKind: () => this.boss?.kind ?? 'none',
      getBossHp: () => this.boss?.logic.hp ?? 0,
      getBossPhase: () => {
        if (!this.boss) return 'none';
        const l = this.boss.logic as { phase?: string };
        return l.phase ?? 'phase1';
      },
      damageBoss: (n: number) => this.boss?.logic.takeDamage(n),
      getMiniGhostCount: () =>
        this.enemies.filter((e) => e.type === 'mini_ghost').length,
      getMiniClownCount: () =>
        this.enemies.filter((e) => e.type === 'mini_clown').length,
      getCrowCount: () => this.enemies.filter((e) => e.type === 'crow').length,
      isConfusionActive: () => this.confusion.isActive,
      hasWaterGun: () => this.hasWaterGun,
      grantWaterGun: () => {
        this.hasWaterGun = true;
        this.save.setPowerUp('waterGun', true);
      },
      hasStar: () => this.playerLogic.hasStar,
      getStarRemaining: () => this.playerLogic.starRemaining,
      activateStar: () => this.playerLogic.activateStar(),
      addExtraHeart: () => {
        this.playerLogic.addExtraHeart();
        this.save.addExtraHeart();
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
    this.events.once('shutdown', () => {
      delete (window as unknown as { __game?: Record<string, unknown> }).__game;
    });
  }
}
