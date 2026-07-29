import { test, expect, Page } from '@playwright/test';
import './gameHooks';

const isCriticalError = (msg: string): boolean => {
  if (msg.includes('Framebuffer status')) return false;
  if (msg.includes('WebGL')) return false;
  return true;
};

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

const gotoWithSave = async (page: Page, save: string): Promise<void> => {
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

const startLevelFromMenu = async (page: Page): Promise<void> => {
  await page.keyboard.press('Enter');
};

test.describe('Sprint 4 — Mundo 2: Caverna Assombrada (Palhaço, Espantalho, FireGhost, Star, ExtraHeart)', () => {
  test('build de produção carrega sem erros críticos', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      if (isCriticalError(err.message)) errors.push(err.message);
    });
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(700);
    expect(errors).toEqual([]);
  });

  test('WorldMap exibe 6 nós após progressão completa', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({
        currentLevel: 6,
        levelsCompleted: [true, true, true, true, true, false, ...new Array(15).fill(false)],
      }),
    );
    await page.keyboard.press('m');
    await page.waitForFunction(() => !!window.__map, null, { timeout: 6000 });
    const states = await page.evaluate(() => ({
      l4: window.__map!.isLevelUnlocked(4),
      l5: window.__map!.isLevelUnlocked(5),
      l6: window.__map!.isLevelUnlocked(6),
    }));
    expect(states.l4).toBe(true);
    expect(states.l5).toBe(true);
    expect(states.l6).toBe(true);
  });

  test('Level 4 carrega ClownBoss com 12 HP em phase1', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({
        currentLevel: 4,
        levelsCompleted: [true, true, true, ...new Array(18).fill(false)],
        powerUps: { waterGun: true, extraHearts: 0 },
      }),
    );
    await startLevelFromMenu(page);
    await page.waitForFunction(() => !!window.__bossIntro, null, { timeout: 6000 });
    await page.evaluate(() => window.__bossIntro!.advance());
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 6000 },
    );
    const kind = await page.evaluate(() => window.__game!.getBossKind());
    const hp = await page.evaluate(() => window.__game!.getBossHp());
    const phase = await page.evaluate(() => window.__game!.getBossPhase());
    expect(kind).toBe('clown');
    expect(hp).toBe(18);
    expect(phase).toBe('phase1');
  });

  test('ClownBoss a 50% HP entra em phase2 e ativa confusão de tela', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({
        currentLevel: 4,
        levelsCompleted: [true, true, true, ...new Array(18).fill(false)],
        powerUps: { waterGun: true, extraHearts: 0 },
      }),
    );
    await startLevelFromMenu(page);
    await page.waitForFunction(() => !!window.__bossIntro, null, { timeout: 6000 });
    await page.evaluate(() => window.__bossIntro!.advance());
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 6000 },
    );
    // ClownBoss now has 18 HP; phase2 threshold is 9. Deal 9 to cross it.
    await page.evaluate(() => window.__game!.damageBoss(9));
    await page.waitForTimeout(200);
    const phase = await page.evaluate(() => window.__game!.getBossPhase());
    const confusion = await page.evaluate(() => window.__game!.isConfusionActive());
    const minis = await page.evaluate(() => window.__game!.getMiniClownCount());
    expect(phase).toBe('phase2');
    expect(confusion).toBe(true);
    expect(minis).toBe(2);
  });

  test('Star pickup ativa imunidade temporária e tinge o jogador', async ({ page }) => {
    await gotoWithSave(page, seedSave());
    await startLevelFromMenu(page);
    await page.waitForFunction(() => !!window.__game, null, { timeout: 6000 });
    const before = await page.evaluate(() => window.__game!.hasStar());
    expect(before).toBe(false);
    await page.evaluate(() => window.__game!.activateStar());
    await page.waitForTimeout(50);
    const after = await page.evaluate(() => window.__game!.hasStar());
    expect(after).toBe(true);
    const remaining = await page.evaluate(() => window.__game!.getStarRemaining());
    expect(remaining).toBeGreaterThan(0);
  });

  test('Star ativa: dano não é aplicado quando damagePlayer chamado', async ({ page }) => {
    await gotoWithSave(page, seedSave());
    await startLevelFromMenu(page);
    await page.waitForFunction(() => !!window.__game, null, { timeout: 6000 });
    const hp0 = await page.evaluate(() => window.__game!.getPlayerHp());
    await page.evaluate(() => window.__game!.activateStar());
    await page.evaluate(() => window.__game!.damagePlayer(2));
    await page.waitForTimeout(80);
    const hp1 = await page.evaluate(() => window.__game!.getPlayerHp());
    expect(hp1).toBe(hp0);
  });

  test('ExtraHeart aumenta maxHp em +2 e persiste no save', async ({ page }) => {
    await gotoWithSave(page, seedSave());
    await startLevelFromMenu(page);
    await page.waitForFunction(() => !!window.__game, null, { timeout: 6000 });
    const max0 = await page.evaluate(() => window.__game!.getPlayerMaxHp());
    await page.evaluate(() => window.__game!.addExtraHeart());
    await page.waitForTimeout(60);
    const max1 = await page.evaluate(() => window.__game!.getPlayerMaxHp());
    expect(max1).toBe(max0 + 2);
    const raw = await page.evaluate(() =>
      window.localStorage.getItem('casa-fantasma-2:save'),
    );
    const data = JSON.parse(raw!);
    expect(data.powerUps.extraHearts).toBe(1);
  });

  test('Level 5 carrega tema cave com FireGhost e checkpoint', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({
        currentLevel: 5,
        levelsCompleted: [true, true, true, true, ...new Array(17).fill(false)],
        powerUps: { waterGun: true, extraHearts: 0 },
      }),
    );
    await startLevelFromMenu(page);
    await page.waitForFunction(() => !!window.__game, null, { timeout: 6000 });
    const theme = await page.evaluate(() => window.__game!.getLevelTheme());
    const lvl = await page.evaluate(() => window.__game!.getLevelIndex());
    const kinds = await page.evaluate(() => window.__game!.getEnemyKinds());
    const cps = await page.evaluate(() => window.__game!.getCheckpointCount());
    expect(theme).toBe('cave');
    expect(lvl).toBe(5);
    expect(kinds).toContain('fire_ghost');
    expect(cps).toBeGreaterThanOrEqual(1);
  });

  test('Level 6 carrega ScarecrowBoss', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({
        currentLevel: 6,
        levelsCompleted: [true, true, true, true, true, ...new Array(16).fill(false)],
        powerUps: { waterGun: true, extraHearts: 1 },
      }),
    );
    await startLevelFromMenu(page);
    await page.waitForFunction(() => !!window.__bossIntro, null, { timeout: 6000 });
    const bossType = await page.evaluate(() => window.__bossIntro!.getBossType());
    expect(bossType).toBe('scarecrow');
    await page.evaluate(() => window.__bossIntro!.advance());
    await page.waitForFunction(
      () => !!window.__game && window.__game.hasBoss(),
      null,
      { timeout: 6000 },
    );
    const kind = await page.evaluate(() => window.__game!.getBossKind());
    expect(kind).toBe('scarecrow');
  });

  test('derrotar ScarecrowBoss desbloqueia próximo nível', async ({ page }) => {
    await gotoWithSave(
      page,
      seedSave({
        currentLevel: 6,
        levelsCompleted: [true, true, true, true, true, ...new Array(16).fill(false)],
        powerUps: { waterGun: true, extraHearts: 1 },
      }),
    );
    await startLevelFromMenu(page);
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
      window.localStorage.getItem('casa-fantasma-2:save'),
    );
    const data = JSON.parse(raw!);
    expect(data.levelsCompleted[5]).toBe(true);
  });
});
