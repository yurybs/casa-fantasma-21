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

const reloadWithSave = async (page: Page, save: string): Promise<void> => {
  await page.goto('/');
  await page.evaluate(
    (s) => window.localStorage.setItem('casa-fantasma-2:save', s),
    save,
  );
  await page.evaluate(() => {
    (window as unknown as { location: Location }).location.assign('/');
  });
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(800);
};

const waitForGame = (page: Page) =>
  page.waitForFunction(() => !!window.__game, null, { timeout: 6000 });

const waitForBossIntro = (page: Page) =>
  page.waitForFunction(() => !!window.__bossIntro, null, { timeout: 6000 });

const waitForMap = (page: Page) =>
  page.waitForFunction(() => !!window.__map, null, { timeout: 6000 });

const waitForPause = (page: Page) =>
  page.waitForFunction(() => !!window.__pause, null, { timeout: 6000 });

test.describe('Navigation — entradas e saídas entre cenas', () => {
  test('LevelComplete → ENTER avança para BossIntroScene quando próximo nível é boss', async ({
    page,
  }) => {
    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 1,
      }),
    );
    await page.keyboard.press('Enter');
    await waitForGame(page);
    await page.evaluate(() => window.__game!.forceVictory());
    await page.waitForTimeout(700);
    // Now on LevelCompleteScene. Press ENTER → BossIntroScene (next is L2 boss).
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    const bossType = await page.evaluate(() => window.__bossIntro!.getBossType());
    expect(bossType).toBe('ghost');
  });

  test('BossIntro: ENTER após o grace period avança para GameScene', async ({ page }) => {
    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 2,
        levelsCompleted: [true, ...new Array(20).fill(false)],
      }),
    );
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    // Wait past the 250ms input grace period.
    await page.waitForTimeout(350);
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 6000 },
    );
    const kind = await page.evaluate(() => window.__game!.getBossKind());
    expect(kind).toBe('ghost');
  });

  test('BossIntro: input dentro do grace period é ignorado', async ({
    page,
  }) => {
    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 2,
        levelsCompleted: [true, ...new Array(20).fill(false)],
      }),
    );
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    // Press Enter immediately within grace period — should be ignored.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
    const stillIntro = await page.evaluate(() => !!window.__bossIntro);
    expect(stillIntro).toBe(true);
  });

  test('LevelComplete → ENTER → BossIntro: pressionar Enter sequencialmente leva à arena do boss', async ({
    page,
  }) => {
    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 1,
      }),
    );
    await page.keyboard.press('Enter');
    await waitForGame(page);
    await page.evaluate(() => window.__game!.forceVictory());
    await page.waitForTimeout(700);
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    // Honor grace period to deliver a *fresh* keydown after scene start.
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 6000 },
    );
    const kind = await page.evaluate(() => window.__game!.getBossKind());
    expect(kind).toBe('ghost');
  });

  test('Sprint 4 fluxo real: Level 3 completo → ENTER → BossIntro Palhaço → ENTER → Arena Palhaço', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 3,
        levelsCompleted: [true, true, false, ...new Array(18).fill(false)],
        powerUps: { waterGun: true, extraHearts: 0 },
      }),
    );
    await page.keyboard.press('Enter');
    await waitForGame(page);
    await page.evaluate(() => window.__game!.forceVictory());
    await page.waitForTimeout(700);
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    expect(await page.evaluate(() => window.__bossIntro!.getBossType())).toBe('clown');
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 6000 },
    );
    expect(await page.evaluate(() => window.__game!.getBossKind())).toBe('clown');
    expect(await page.evaluate(() => window.__game!.getLevelIndex())).toBe(4);
    expect(errors).toEqual([]);
  });

  test('Sprint 4 fluxo real: Level 5 completo → ENTER → BossIntro Espantalho → ENTER → Arena Espantalho', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 5,
        levelsCompleted: [true, true, true, true, false, ...new Array(16).fill(false)],
        powerUps: { waterGun: true, extraHearts: 1 },
      }),
    );
    await page.keyboard.press('Enter');
    await waitForGame(page);
    await page.evaluate(() => window.__game!.forceVictory());
    await page.waitForTimeout(700);
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    expect(await page.evaluate(() => window.__bossIntro!.getBossType())).toBe('scarecrow');
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 6000 },
    );
    expect(await page.evaluate(() => window.__game!.getBossKind())).toBe('scarecrow');
    expect(await page.evaluate(() => window.__game!.getLevelIndex())).toBe(6);
    expect(errors).toEqual([]);
  });

  test('REGRESSION: Menu Enter (save L4) → BossIntro Palhaço → Enter avança (sem grace, sem hold)', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 4,
        levelsCompleted: [true, true, true, ...new Array(18).fill(false)],
        powerUps: { waterGun: true, extraHearts: 0 },
      }),
    );
    // Press Enter on Menu — sends to BossIntroScene (clown).
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    expect(await page.evaluate(() => window.__bossIntro!.getBossType())).toBe('clown');

    // Now press Enter to advance. Even if the press lands inside the input grace
    // window, the queued-press logic must still trigger advance shortly after.
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter');

    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 4000 },
    );
    expect(await page.evaluate(() => window.__game!.getBossKind())).toBe('clown');
    expect(errors).toEqual([]);
  });

  test('REGRESSION: BossIntro Enter pressionado DURANTE o grace period é enfileirado e dispara depois', async ({
    page,
  }) => {
    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 4,
        levelsCompleted: [true, true, true, ...new Array(18).fill(false)],
        powerUps: { waterGun: true, extraHearts: 0 },
      }),
    );
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);

    // Press immediately (inside grace) — the press must NOT be lost.
    await page.keyboard.press('Enter');

    // Within ~400ms (grace 250 + frame slack), advance must have fired.
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 2000 },
    );
    expect(await page.evaluate(() => window.__game!.getBossKind())).toBe('clown');
  });

  test('REGRESSION: BossIntro Esc cancela e volta ao WorldMap', async ({ page }) => {
    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 4,
        levelsCompleted: [true, true, true, ...new Array(18).fill(false)],
        powerUps: { waterGun: true, extraHearts: 0 },
      }),
    );
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await waitForMap(page);
    expect(await page.evaluate(() => !!window.__map)).toBe(true);
    expect(await page.evaluate(() => !window.__bossIntro)).toBe(true);
  });

  test('REGRESSION: BossIntro Espantalho (Level 6) — Enter avança via teclado', async ({ page }) => {
    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 6,
        levelsCompleted: [true, true, true, true, true, ...new Array(16).fill(false)],
        powerUps: { waterGun: true, extraHearts: 1 },
      }),
    );
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    expect(await page.evaluate(() => window.__bossIntro!.getBossType())).toBe('scarecrow');
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 4000 },
    );
    expect(await page.evaluate(() => window.__game!.getBossKind())).toBe('scarecrow');
  });

  test('BossIntro: sem input, permanece na tela (não há auto-advance)', async ({ page }) => {
    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 4,
        levelsCompleted: [true, true, true, ...new Array(18).fill(false)],
        powerUps: { waterGun: true, extraHearts: 0 },
      }),
    );
    await page.keyboard.press('Enter');
    await waitForBossIntro(page);
    // Wait well past the old 2s auto-advance duration — intro must remain.
    await page.waitForTimeout(2800);
    expect(await page.evaluate(() => !!window.__bossIntro)).toBe(true);
    expect(await page.evaluate(() => !window.__game)).toBe(true);
  });

  test('Pause: ESC abre o menu de pausa expondo __pause', async ({ page }) => {
    await reloadWithSave(page, seedSave());
    await page.keyboard.press('Enter');
    await waitForGame(page);
    await page.keyboard.press('Escape');
    await waitForPause(page);
    expect(await page.evaluate(() => typeof window.__pause!.quitToMap)).toBe('function');
    expect(await page.evaluate(() => typeof window.__pause!.quitToMenu)).toBe('function');
    expect(await page.evaluate(() => typeof window.__pause!.resume)).toBe('function');
  });

  test('Pause → "Voltar ao Mapa" leva para WorldMapScene', async ({ page }) => {
    await reloadWithSave(page, seedSave());
    await page.keyboard.press('Enter');
    await waitForGame(page);
    await page.keyboard.press('Escape');
    await waitForPause(page);
    await page.evaluate(() => window.__pause!.quitToMap());
    await waitForMap(page);
    expect(await page.evaluate(() => !!window.__map)).toBe(true);
    expect(await page.evaluate(() => !window.__game)).toBe(true);
  });

  test('Pause → "Menu Principal" leva para MenuScene', async ({ page }) => {
    await reloadWithSave(page, seedSave());
    await page.keyboard.press('Enter');
    await waitForGame(page);
    await page.keyboard.press('Escape');
    await waitForPause(page);
    await page.evaluate(() => window.__pause!.quitToMenu());
    await page.waitForTimeout(700);
    // No __game / __map / __pause / __bossIntro hooks should be active on the menu.
    const onMenu = await page.evaluate(
      () => !window.__game && !window.__map && !window.__pause && !window.__bossIntro,
    );
    expect(onMenu).toBe(true);
  });

  test('WorldMap → ESC volta para MenuScene', async ({ page }) => {
    await reloadWithSave(page, seedSave());
    await page.keyboard.press('m');
    await waitForMap(page);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => !window.__map)).toBe(true);
  });

  test('WorldMap → entrar nível normal (Level 1) → GameScene sem BossIntro', async ({ page }) => {
    await reloadWithSave(page, seedSave());
    await page.keyboard.press('m');
    await waitForMap(page);
    await page.evaluate(() => window.__map!.enterSelectedLevel());
    await waitForGame(page);
    expect(await page.evaluate(() => window.__game!.hasBoss())).toBe(false);
    expect(await page.evaluate(() => window.__game!.getLevelIndex())).toBe(1);
  });

  test('Restart pelo Pause mantém o levelIndex atual (não cai para Level 1)', async ({ page }) => {
    await reloadWithSave(
      page,
      seedSave({
        currentLevel: 3,
        levelsCompleted: [true, true, ...new Array(19).fill(false)],
        powerUps: { waterGun: true, extraHearts: 0 },
      }),
    );
    await page.keyboard.press('Enter');
    await waitForGame(page);
    expect(await page.evaluate(() => window.__game!.getLevelIndex())).toBe(3);
    await page.keyboard.press('Escape');
    await waitForPause(page);
    await page.evaluate(() => window.__pause!.restart());
    await waitForGame(page);
    expect(await page.evaluate(() => window.__game!.getLevelIndex())).toBe(3);
  });
});
