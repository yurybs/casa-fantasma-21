import { test, expect, Page } from '@playwright/test';
import './gameHooks';

const isCriticalError = (msg: string): boolean => {
  if (msg.includes('Framebuffer status')) return false;
  if (msg.includes('WebGL')) return false;
  return true;
};

const enterGameScene = async (page: Page): Promise<void> => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(800);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !!window.__game, null, { timeout: 6000 });
  await page.waitForTimeout(400);
};

const openWorldMap = async (page: Page): Promise<void> => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(800);
  await page.keyboard.press('m');
  await page.waitForFunction(() => !!window.__map, null, { timeout: 6000 });
  await page.waitForTimeout(300);
};

const completeLevelInPlace = async (page: Page): Promise<void> => {
  await page.evaluate(() => window.__game!.forceVictory());
  await page.waitForTimeout(700);
};

test.describe('Sprint 3 — Mundo 1 Completo (mapa, boss, checkpoints, save)', () => {
  test('build de produção carrega sem erros críticos', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      if (isCriticalError(err.message)) errors.push(err.message);
    });
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    expect(errors).toEqual([]);
  });

  test('menu: tecla M abre o WorldMapScene', async ({ page }) => {
    await openWorldMap(page);
    const cursor = await page.evaluate(() => window.__map!.getCursorLevelIndex());
    expect(cursor).toBe(1);
  });

  test('WorldMap inicialmente desbloqueia apenas o nível 1', async ({ page }) => {
    await openWorldMap(page);
    const states = await page.evaluate(() => ({
      l1: window.__map!.isLevelUnlocked(1),
      l2: window.__map!.isLevelUnlocked(2),
      l3: window.__map!.isLevelUnlocked(3),
    }));
    expect(states.l1).toBe(true);
    expect(states.l2).toBe(false);
    expect(states.l3).toBe(false);
  });

  test('completar nível 1 desbloqueia o nível 2 no mapa', async ({ page }) => {
    await enterGameScene(page);
    await completeLevelInPlace(page);
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const win = window as unknown as { location: Location };
      win.location.assign('/');
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('m');
    await page.waitForFunction(() => !!window.__map, null, { timeout: 6000 });
    await page.waitForTimeout(300);
    const unlocked2 = await page.evaluate(() => window.__map!.isLevelUnlocked(2));
    expect(unlocked2).toBe(true);
  });

  test('entrar no nível 2 mostra BossIntroScene (carta Pokédex)', async ({ page }) => {
    await enterGameScene(page);
    await completeLevelInPlace(page);
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const win = window as unknown as { location: Location };
      win.location.assign('/');
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('m');
    await page.waitForFunction(() => !!window.__map, null, { timeout: 6000 });
    await page.evaluate(() => window.__map!.moveCursor(1));
    await page.evaluate(() => window.__map!.enterSelectedLevel());
    await page.waitForFunction(() => !!window.__bossIntro, null, { timeout: 6000 });
    const bossType = await page.evaluate(() => window.__bossIntro!.getBossType());
    expect(bossType).toBe('ghost');
  });

  test('BossIntro: ENTER avança para a GameScene com o boss', async ({ page }) => {
    await enterGameScene(page);
    await completeLevelInPlace(page);
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const win = window as unknown as { location: Location };
      win.location.assign('/');
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('m');
    await page.waitForFunction(() => !!window.__map, null, { timeout: 6000 });
    await page.evaluate(() => window.__map!.moveCursor(1));
    await page.evaluate(() => window.__map!.enterSelectedLevel());
    await page.waitForFunction(() => !!window.__bossIntro, null, { timeout: 6000 });
    await page.evaluate(() => window.__bossIntro!.advance());
    await page.waitForFunction(
      () => !!window.__game && window.__game.getLevelIndex() === 2,
      null,
      { timeout: 6000 },
    );
    const hasBoss = await page.evaluate(() => window.__game!.hasBoss());
    expect(hasBoss).toBe(true);
  });

  test('boss inicia com 8 HP em fase 1', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => {
      const save = window.localStorage;
      save.setItem(
        'toy-blaster-kid:save',
        JSON.stringify({
          currentLevel: 2,
          lives: 3,
          coins: 0,
          levelsCompleted: [true, ...new Array(20).fill(false)],
          highScore: 0,
          checkpoint: null,
          powerUps: { waterGun: false },
        }),
      );
    });
    await page.evaluate(() => {
      const win = window as unknown as { location: Location };
      win.location.assign('/');
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !!window.__bossIntro, null, { timeout: 6000 });
    await page.evaluate(() => window.__bossIntro!.advance());
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 6000 },
    );
    const hp = await page.evaluate(() => window.__game!.getBossHp());
    const phase = await page.evaluate(() => window.__game!.getBossPhase());
    expect(hp).toBe(8);
    expect(phase).toBe('phase1');
  });

  test('boss a 50% HP entra em phase2 e spawna 2 mini-fantasmas', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => {
      window.localStorage.setItem(
        'toy-blaster-kid:save',
        JSON.stringify({
          currentLevel: 2,
          lives: 3,
          coins: 0,
          levelsCompleted: [true, ...new Array(20).fill(false)],
          highScore: 0,
          checkpoint: null,
          powerUps: { waterGun: true },
        }),
      );
    });
    await page.evaluate(() => {
      const win = window as unknown as { location: Location };
      win.location.assign('/');
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !!window.__bossIntro, null, { timeout: 6000 });
    await page.evaluate(() => window.__bossIntro!.advance());
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 6000 },
    );
    await page.evaluate(() => window.__game!.damageBoss(4));
    await page.waitForTimeout(300);
    const phase = await page.evaluate(() => window.__game!.getBossPhase());
    const minis = await page.evaluate(() => window.__game!.getMiniGhostCount());
    expect(phase).toBe('phase2');
    expect(minis).toBe(2);
  });

  test('derrotar boss leva à vitória e desbloqueia nível 3', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => {
      window.localStorage.setItem(
        'toy-blaster-kid:save',
        JSON.stringify({
          currentLevel: 2,
          lives: 3,
          coins: 0,
          levelsCompleted: [true, ...new Array(20).fill(false)],
          highScore: 0,
          checkpoint: null,
          powerUps: { waterGun: true },
        }),
      );
    });
    await page.evaluate(() => {
      const win = window as unknown as { location: Location };
      win.location.assign('/');
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !!window.__bossIntro, null, { timeout: 6000 });
    await page.evaluate(() => window.__bossIntro!.advance());
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 6000 },
    );
    await page.evaluate(() => window.__game!.damageBoss(99));
    await page.waitForTimeout(800);
    const ended = await page.evaluate(() => !window.__game || window.__game.isGameEnded());
    expect(ended).toBe(true);
    const raw = await page.evaluate(() =>
      window.localStorage.getItem('toy-blaster-kid:save'),
    );
    const data = JSON.parse(raw!);
    expect(data.levelsCompleted[1]).toBe(true);
    expect(data.currentLevel).toBeGreaterThanOrEqual(3);
  });

  test('WaterGun: powerUp persiste no save após coleta', async ({ page }) => {
    await enterGameScene(page);
    const before = await page.evaluate(() => window.__game!.hasWaterGun());
    expect(before).toBe(false);
    await page.evaluate(() => window.__game!.grantWaterGun());
    await page.waitForTimeout(60);
    const after = await page.evaluate(() => window.__game!.hasWaterGun());
    expect(after).toBe(true);
    const raw = await page.evaluate(() =>
      window.localStorage.getItem('toy-blaster-kid:save'),
    );
    const data = JSON.parse(raw!);
    expect(data.powerUps.waterGun).toBe(true);
  });

  test('Checkpoint: tocar bandeira de checkpoint salva no localStorage', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => {
      window.localStorage.setItem(
        'toy-blaster-kid:save',
        JSON.stringify({
          currentLevel: 3,
          lives: 3,
          coins: 0,
          levelsCompleted: [true, true, ...new Array(19).fill(false)],
          highScore: 0,
          checkpoint: null,
          powerUps: { waterGun: true },
        }),
      );
    });
    await page.evaluate(() => {
      const win = window as unknown as { location: Location };
      win.location.assign('/');
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !!window.__game, null, { timeout: 6000 });
    await page.waitForTimeout(300);
    const cpCount = await page.evaluate(() => window.__game!.getCheckpointCount());
    expect(cpCount).toBeGreaterThanOrEqual(1);
    // Teleport player onto the checkpoint flag (Level 3 cp at 35*16=560, (24-4)*16=320)
    await page.evaluate(() => window.__game!.teleportPlayer(35 * 16, (24 - 4) * 16));
    await page.waitForTimeout(200);
    const activeAfter = await page.evaluate(() => window.__game!.getActiveCheckpointCount());
    expect(activeAfter).toBeGreaterThanOrEqual(1);
    const cpSaved = await page.evaluate(() => window.__game!.getSavedCheckpoint());
    expect(cpSaved).not.toBeNull();
    expect(cpSaved!.levelIndex).toBe(3);
  });

  test('Spider Ghost: nível 3 carrega com inimigos spider_ghost', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => {
      window.localStorage.setItem(
        'toy-blaster-kid:save',
        JSON.stringify({
          currentLevel: 3,
          lives: 3,
          coins: 0,
          levelsCompleted: [true, true, ...new Array(19).fill(false)],
          highScore: 0,
          checkpoint: null,
          powerUps: { waterGun: false },
        }),
      );
    });
    await page.evaluate(() => {
      const win = window as unknown as { location: Location };
      win.location.assign('/');
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !!window.__game, null, { timeout: 6000 });
    const lvl = await page.evaluate(() => window.__game!.getLevelIndex());
    const enemyCount = await page.evaluate(() => window.__game!.getEnemyCount());
    expect(lvl).toBe(3);
    expect(enemyCount).toBeGreaterThan(0);
  });

  test('Save persistente: progresso e powerUps sobrevivem ao reload', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => {
      window.localStorage.setItem(
        'toy-blaster-kid:save',
        JSON.stringify({
          currentLevel: 3,
          lives: 2,
          coins: 42,
          levelsCompleted: [true, true, false, ...new Array(18).fill(false)],
          highScore: 999,
          checkpoint: { levelIndex: 3, x: 200, y: 300 },
          powerUps: { waterGun: true },
        }),
      );
    });
    await page.evaluate(() => {
      const win = window as unknown as { location: Location };
      win.location.assign('/');
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    const raw = await page.evaluate(() =>
      window.localStorage.getItem('toy-blaster-kid:save'),
    );
    const data = JSON.parse(raw!);
    expect(data.currentLevel).toBe(3);
    expect(data.coins).toBe(42);
    expect(data.levelsCompleted[0]).toBe(true);
    expect(data.levelsCompleted[1]).toBe(true);
    expect(data.powerUps.waterGun).toBe(true);
    expect(data.checkpoint).toEqual({ levelIndex: 3, x: 200, y: 300 });
  });

  test('Save antigo (sem powerUps/checkpoint) carrega com defaults', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem(
        'toy-blaster-kid:save',
        JSON.stringify({
          currentLevel: 2,
          lives: 3,
          coins: 10,
          levelsCompleted: [true, ...new Array(20).fill(false)],
          highScore: 0,
        }),
      );
    });
    await page.evaluate(() => {
      const win = window as unknown as { location: Location };
      win.location.assign('/');
    });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('m');
    await page.waitForFunction(() => !!window.__map, null, { timeout: 6000 });
    const unlockedL2 = await page.evaluate(() => window.__map!.isLevelUnlocked(2));
    expect(unlockedL2).toBe(true);
  });
});
