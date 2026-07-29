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

const enterBossArena = async (page: Page, currentLevel: number): Promise<void> => {
  await gotoWithSave(
    page,
    seedSave({
      currentLevel,
      levelsCompleted: completedThrough(currentLevel - 1),
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

test.describe('Sprint 7 — Mundo 4 (Castelo do Robô: Bola de Fogo + Polvo)', () => {
  test('Level 13: carrega tema castle + BossIntro Bola de Fogo → arena fireball phase1', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({
        currentLevel: 13,
        levelsCompleted: completedThrough(12),
        powerUps: { waterGun: true, extraHearts: 1 },
      }),
    );
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    expect(await page.evaluate(() => window.__bossIntro!.getBossType())).toBe('fireball');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !!window.__game && window.__game.hasBoss(), null, { timeout: 10000 });
    expect(await page.evaluate(() => window.__game!.getBossKind())).toBe('fireball');
    expect(await page.evaluate(() => window.__game!.getBossPhase())).toBe('phase1');
    expect(await page.evaluate(() => window.__game!.getLevelTheme())).toBe('castle');
  });

  test('Bola de Fogo tem HP maior (22) e deixa rastro de fogo', async ({ page }) => {
    await enterBossArena(page, 13);
    expect(await page.evaluate(() => window.__game!.getBossMaxHp())).toBe(22);
    // Fire trail is dropped continuously (~every 200ms).
    await page.waitForFunction(() => window.__game!.getFireTrailCount() > 0, null, { timeout: 6000 });
    expect(await page.evaluate(() => window.__game!.getFireTrailCount())).toBeGreaterThan(0);
  });

  test('Bola de Fogo se divide em mini fireballs na fase 2', async ({ page }) => {
    await enterBossArena(page, 13);
    // 22 HP, phase2 at 11 → 11 damage.
    await page.evaluate(() => {
      for (let i = 0; i < 11; i++) window.__game!.damageBoss(1);
    });
    expect(await page.evaluate(() => window.__game!.getBossPhase())).toBe('phase2');
    expect(await page.evaluate(() => window.__game!.getMiniFireballCount())).toBeGreaterThanOrEqual(1);
  });

  test('Level 14 (Torre) é vertical e tem inimigos mini_fireball/mini_octopus', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({ currentLevel: 14, levelsCompleted: completedThrough(13) }),
    );
    await page.keyboard.press('Enter');
    await waitForGame(page);
    expect(await page.evaluate(() => window.__game!.getLevelIndex())).toBe(14);
    expect(await page.evaluate(() => window.__game!.hasBoss())).toBe(false);
    const kinds = await page.evaluate(() => window.__game!.getEnemyKinds());
    expect(kinds.some((k: string) => k === 'mini_fireball' || k === 'mini_octopus')).toBe(true);
  });

  test('Level 15: BossIntro Polvo → arena octopus com 4 tentáculos (phase1)', async ({ page }) => {
    await enterBossArena(page, 15);
    expect(await page.evaluate(() => window.__game!.getBossKind())).toBe('octopus');
    expect(await page.evaluate(() => window.__game!.getBossPhase())).toBe('phase1');
    expect(await page.evaluate(() => window.__game!.getBossMaxHp())).toBe(24);
    expect(await page.evaluate(() => window.__game!.getTentacleCount())).toBe(4);
  });

  test('Polvo escurece a tela com tinta e cresce para 6 tentáculos na fase 2', async ({ page }) => {
    await enterBossArena(page, 15);
    // Ink splashes periodically (~6s in phase 1); wait for the first splash.
    await page.waitForFunction(() => window.__game!.isInkActive(), null, { timeout: 12000 });
    expect(await page.evaluate(() => window.__game!.isInkActive())).toBe(true);

    // 24 HP, phase2 at 12 → 12 damage.
    await page.evaluate(() => {
      for (let i = 0; i < 12; i++) window.__game!.damageBoss(1);
    });
    expect(await page.evaluate(() => window.__game!.getBossPhase())).toBe('phase2');
    expect(await page.evaluate(() => window.__game!.getTentacleCount())).toBe(6);
    expect(await page.evaluate(() => window.__game!.getMiniOctopusCount())).toBeGreaterThanOrEqual(1);
  });

  test('WorldMap agora mostra 15 nós (4 mundos)', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({ currentLevel: 13, levelsCompleted: completedThrough(12) }),
    );
    await page.waitForTimeout(500);
    await page.keyboard.press('m');
    await page.waitForFunction(() => !!window.__map, null, { timeout: 10000 });
    expect(await page.evaluate(() => window.__map!.isLevelUnlocked(13))).toBe(true);
    // Navigate the cursor all the way to the last node (level 15).
    for (let i = 0; i < 14; i++) {
      await page.evaluate(() => window.__map!.moveCursor(1));
    }
    expect(await page.evaluate(() => window.__map!.getCursorLevelIndex())).toBe(15);
  });

  test('REGRESSÃO HP: chefes anteriores agora têm mais vida (Fantasma 12)', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({
        currentLevel: 2,
        levelsCompleted: completedThrough(1),
        powerUps: { waterGun: true, extraHearts: 0 },
      }),
    );
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !!window.__game && window.__game.hasBoss(), null, { timeout: 10000 });
    expect(await page.evaluate(() => window.__game!.getBossMaxHp())).toBe(12);
  });
});
