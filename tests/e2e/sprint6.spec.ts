import { test, expect, Page } from '@playwright/test';
import './gameHooks';

const seedSave = (overrides: Record<string, unknown> = {}): string => {
  const base = {
    currentLevel: 1,
    lives: 3,
    coins: 0,
    levelsCompleted: new Array(21).fill(false),
    highScore: 0,
    checkpoint: null,
    powerUps: { waterGun: false, extraHearts: 0 },
    ...overrides,
  };
  return JSON.stringify(base);
};

const completedThrough = (n: number): boolean[] => [
  ...new Array(n).fill(true),
  ...new Array(21 - n).fill(false),
];

const gotoWithSave = async (page: Page, save: string): Promise<void> => {
  await page.goto('/');
  await page.evaluate(
    (s) => window.localStorage.setItem('casa-fantasma-2:save', s),
    save,
  );
  await page.evaluate(() => {
    (window as unknown as { location: Location }).location.assign('/');
  });
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1200);
};

const waitForGame = (page: Page) =>
  page.waitForFunction(() => !!window.__game, null, { timeout: 12000 });

const waitForBossIntro = (page: Page) =>
  page.waitForFunction(() => !!window.__bossIntro, null, { timeout: 12000 });

const enterVampireArena = async (page: Page): Promise<void> => {
  await gotoWithSave(
    page,
    seedSave({
      currentLevel: 11,
      levelsCompleted: completedThrough(10),
      powerUps: { waterGun: true, extraHearts: 1 },
    }),
  );
  await page.keyboard.press('Enter');
  await waitForBossIntro(page);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => !!window.__game && window.__game.hasBoss(),
    null,
    { timeout: 10000 },
  );
};

test.describe('Sprint 6 — Mundo 3 Parte 2 (Vampiro + Lifesteal)', () => {
  test('Level 10 carrega com tema city, sem boss, com checkpoint e power-up', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({ currentLevel: 10, levelsCompleted: completedThrough(9) }),
    );
    await page.keyboard.press('Enter');
    await waitForGame(page);

    expect(await page.evaluate(() => window.__game!.getLevelIndex())).toBe(10);
    expect(await page.evaluate(() => window.__game!.getLevelTheme())).toBe('city');
    expect(await page.evaluate(() => window.__game!.hasBoss())).toBe(false);
    expect(await page.evaluate(() => window.__game!.getCheckpointCount())).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.__game!.getPowerUpCount())).toBeGreaterThan(0);
  });

  test('Level 11: BossIntro do Vampiro → Enter → Arena com boss vampire phase1', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({
        currentLevel: 11,
        levelsCompleted: completedThrough(10),
        powerUps: { waterGun: true, extraHearts: 1 },
      }),
    );
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    expect(await page.evaluate(() => window.__bossIntro!.getBossType())).toBe('vampire');

    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 10000 },
    );
    expect(await page.evaluate(() => window.__game!.getBossKind())).toBe('vampire');
    expect(await page.evaluate(() => window.__game!.getBossPhase())).toBe('phase1');
  });

  test('lifesteal: 3 acertos no jogador fazem o HP do boss subir', async ({ page }) => {
    await enterVampireArena(page);

    // Damage the boss so there is room to heal
    await page.evaluate(() => {
      for (let i = 0; i < 4; i++) window.__game!.damageBoss(1);
    });
    const hpBefore = await page.evaluate(() => window.__game!.getBossHp());

    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) window.__game!.registerLifestealHit();
    });
    const hpAfter = await page.evaluate(() => window.__game!.getBossHp());
    expect(hpAfter).toBeGreaterThan(hpBefore);
  });

  test('WaterGun bloqueia o lifesteal visivelmente (hits não curam)', async ({ page }) => {
    await enterVampireArena(page);

    await page.evaluate(() => {
      for (let i = 0; i < 4; i++) window.__game!.damageBoss(1);
    });
    expect(await page.evaluate(() => window.__game!.isLifestealBlocked())).toBe(false);

    await page.evaluate(() => window.__game!.blockBossLifesteal());
    expect(await page.evaluate(() => window.__game!.isLifestealBlocked())).toBe(true);

    const hpBefore = await page.evaluate(() => window.__game!.getBossHp());
    await page.evaluate(() => {
      for (let i = 0; i < 6; i++) window.__game!.registerLifestealHit();
    });
    const hpAfter = await page.evaluate(() => window.__game!.getBossHp());
    expect(hpAfter).toBe(hpBefore);
  });

  test('phase 2: transformação em morcego gigante spawna mini vampiros', async ({ page }) => {
    await enterVampireArena(page);

    // HP 16, threshold 8 → 8 damage triggers phase 2
    await page.evaluate(() => {
      for (let i = 0; i < 8; i++) window.__game!.damageBoss(1);
    });
    expect(await page.evaluate(() => window.__game!.getBossPhase())).toBe('phase2');
    expect(
      await page.evaluate(() => window.__game!.getMiniVampireCount()),
    ).toBeGreaterThanOrEqual(1);
  });

  test('boss lança morcegos teleguiados durante a luta', async ({ page }) => {
    await enterVampireArena(page);

    // First bat wave fires after ~4.2s
    await page.waitForFunction(
      () => window.__game!.getBatCount() > 0,
      null,
      { timeout: 12000 },
    );
    expect(await page.evaluate(() => window.__game!.getBatCount())).toBeGreaterThan(0);
  });

  test('Level 12 carrega com mini_vampire e bat spawnados', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({ currentLevel: 12, levelsCompleted: completedThrough(11) }),
    );
    await page.keyboard.press('Enter');
    await waitForGame(page);

    expect(await page.evaluate(() => window.__game!.getLevelIndex())).toBe(12);
    const kinds = await page.evaluate(() => window.__game!.getEnemyKinds());
    expect(kinds.filter((k: string) => k === 'mini_vampire').length).toBeGreaterThan(0);
    expect(kinds.filter((k: string) => k === 'bat').length).toBeGreaterThan(0);
  });

  test('WorldMap mostra 12 nodes com Arena do Vampiro desbloqueável', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({ currentLevel: 11, levelsCompleted: completedThrough(10) }),
    );
    await page.waitForTimeout(500);
    await page.keyboard.press('m');
    await page.waitForFunction(() => !!window.__map, null, { timeout: 10000 });

    expect(await page.evaluate(() => window.__map!.isLevelUnlocked(11))).toBe(true);

    // Move cursor to the last node (12 nodes → 11 moves from the first)
    for (let i = 0; i < 11; i++) {
      await page.evaluate(() => window.__map!.moveCursor(1));
    }
    expect(await page.evaluate(() => window.__map!.getCursorLevelIndex())).toBe(12);
  });
});
