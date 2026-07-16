export interface CheckpointHook {
  levelIndex: number;
  x: number;
  y: number;
}

export interface GameHooks {
  getPlayerHp: () => number;
  getPlayerLives: () => number;
  getCoins: () => number;
  getEnemyCount: () => number;
  getProjectileCount: () => number;
  getPlayerX: () => number;
  getPlayerY: () => number;
  getPlayerVx: () => number;
  getPlayerVy: () => number;
  isPlayerOnGround: () => boolean;
  teleportPlayer: (x: number, y: number) => void;
  damagePlayer: (n: number) => void;
  getTimeRemaining: () => number;
  isGameEnded: () => boolean;
  forceGameOver: () => void;
  forceVictory: () => void;
  getActiveSceneKey: () => string;
  getSoundEvents: () => { type: string; key?: string; volume?: number }[];
  getMusicVolume: () => number;
  getSfxVolume: () => number;
  getMuted: () => boolean;
  pressVirtualKey: (code: string) => void;
  releaseVirtualKey: (code: string) => void;
  isTouchEnabled: () => boolean;
  getDelta: () => number;
  getFps: () => number;
  // Sprint 3 additions
  getLevelIndex: () => number;
  getLevelId: () => number;
  hasBoss: () => boolean;
  getBossHp: () => number;
  getBossPhase: () => 'phase1' | 'phase2' | 'phase3' | 'none';
  damageBoss: (n: number) => void;
  getMiniGhostCount: () => number;
  hasWaterGun: () => boolean;
  grantWaterGun: () => void;
  getPowerUpCount: () => number;
  getCheckpointCount: () => number;
  getActiveCheckpointCount: () => number;
  getRespawnX: () => number;
  getRespawnY: () => number;
  getSavedCheckpoint: () => CheckpointHook | null;
  forceFireProjectile: () => void;
  // Sprint 4 additions
  getPlayerMaxHp: () => number;
  getEnemyKinds: () => string[];
  getJuggleBallCount: () => number;
  getFireTrailCount: () => number;
  getLevelTheme: () => 'forest' | 'cave' | 'city';
  getBossKind: () => 'ghost' | 'clown' | 'scarecrow' | 'trex' | 'vampire' | 'none';
  getMiniClownCount: () => number;
  getCrowCount: () => number;
  isConfusionActive: () => boolean;
  hasStar: () => boolean;
  getStarRemaining: () => number;
  activateStar: () => void;
  addExtraHeart: () => void;
  // Sprint 5 additions
  getMiniTRexCount: () => number;
  getShockwaveCount: () => number;
  isCameraShaking: () => boolean;
  getCameraShakeOffset: () => { x: number; y: number };
  hasNerfRifle: () => boolean;
  getNerfRifleRemaining: () => number;
  activateNerfRifle: () => void;
  // Sprint 6 additions
  getMiniVampireCount: () => number;
  getBatCount: () => number;
  getBossMaxHp: () => number;
  isLifestealBlocked: () => boolean;
  getLifestealHitCount: () => number;
  registerLifestealHit: () => void;
  blockBossLifesteal: () => void;
}

export interface MapHooks {
  getCursorIndex: () => number;
  getCursorLevelIndex: () => number;
  moveCursor: (delta: number) => void;
  enterSelectedLevel: () => void;
  isLevelUnlocked: (levelIndex: number) => boolean;
}

export interface BossIntroHooks {
  advance: () => void;
  cancel: () => void;
  getBossType: () => string;
  getLevelIndex: () => number;
}

export interface PauseHooks {
  resume: () => void;
  quitToMap: () => void;
  quitToMenu: () => void;
  restart: () => void;
}

declare global {
  interface Window {
    __game?: GameHooks;
    __map?: MapHooks;
    __bossIntro?: BossIntroHooks;
    __pause?: PauseHooks;
  }
}
