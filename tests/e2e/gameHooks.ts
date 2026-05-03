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
  getBossPhase: () => 'phase1' | 'phase2' | 'none';
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
  getBossType: () => string;
  getLevelIndex: () => number;
}

declare global {
  interface Window {
    __game?: GameHooks;
    __map?: MapHooks;
    __bossIntro?: BossIntroHooks;
  }
}
