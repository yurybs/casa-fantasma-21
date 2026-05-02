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
}

declare global {
  interface Window {
    __game?: GameHooks;
  }
}
