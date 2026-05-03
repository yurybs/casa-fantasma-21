import { test, expect, Page, devices } from '@playwright/test';
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
  await page.waitForFunction(() => !!window.__game, null, { timeout: 5000 });
  await page.waitForTimeout(400);
};

test.describe('Sprint 2 — Polish: Audio, Touch, Particles, Transitions, Performance', () => {
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

  test('SoundSystem é exposto e tem volumes padrão', async ({ page }) => {
    await enterGameScene(page);
    const data = await page.evaluate(() => ({
      music: window.__game!.getMusicVolume(),
      sfx: window.__game!.getSfxVolume(),
      muted: window.__game!.getMuted(),
    }));
    expect(data.music).toBeGreaterThan(0);
    expect(data.music).toBeLessThanOrEqual(1);
    expect(data.sfx).toBeGreaterThan(0);
    expect(data.sfx).toBeLessThanOrEqual(1);
    expect(typeof data.muted).toBe('boolean');
  });

  test('coletar moeda dispara SFX coin', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => window.__game!.getSoundEvents());
    await page.evaluate(() => window.__game!.teleportPlayer(9 * 16, (24 - 7) * 16));
    await page.waitForTimeout(400);
    const events = await page.evaluate(() => window.__game!.getSoundEvents());
    const sfxKeys = events.filter((e) => e.type === 'sfx').map((e) => e.key);
    expect(sfxKeys).toContain('coin');
  });

  test('pular dispara SFX jump', async ({ page }) => {
    await enterGameScene(page);
    await page.waitForFunction(() => window.__game!.isPlayerOnGround(), null, { timeout: 3000 });
    await page.evaluate(() => window.__game!.getSoundEvents());
    await page.keyboard.down('Space');
    await page.waitForTimeout(50);
    await page.keyboard.up('Space');
    await page.waitForTimeout(120);
    const events = await page.evaluate(() => window.__game!.getSoundEvents());
    const sfxKeys = events.filter((e) => e.type === 'sfx').map((e) => e.key);
    expect(sfxKeys).toContain('jump');
  });

  test('atirar dispara SFX shoot', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => window.__game!.getSoundEvents());
    await page.keyboard.down('KeyZ');
    await page.waitForTimeout(50);
    await page.keyboard.up('KeyZ');
    await page.waitForTimeout(100);
    const events = await page.evaluate(() => window.__game!.getSoundEvents());
    const sfxKeys = events.filter((e) => e.type === 'sfx').map((e) => e.key);
    expect(sfxKeys).toContain('shoot');
  });

  test('tomar dano dispara SFX hit', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => window.__game!.getSoundEvents());
    await page.evaluate(() => window.__game!.damagePlayer(1));
    await page.waitForTimeout(100);
    const events = await page.evaluate(() => window.__game!.getSoundEvents());
    const sfxKeys = events.filter((e) => e.type === 'sfx').map((e) => e.key);
    expect(sfxKeys).toContain('hit');
  });

  test('vitória dispara SFX level_clear', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => window.__game!.getSoundEvents());
    await page.evaluate(() => window.__game!.forceVictory());
    await page.waitForTimeout(150);
    const events = await page.evaluate(
      () => window.__game?.getSoundEvents?.() ?? [],
    );
    const sfxKeys = events.filter((e) => e.type === 'sfx').map((e) => e.key);
    expect(sfxKeys).toContain('level_clear');
  });

  test('virtualKey: tecla virtual ArrowRight move o personagem (paridade com toque)', async ({ page }) => {
    await enterGameScene(page);
    const x0 = await page.evaluate(() => window.__game!.getPlayerX());
    await page.evaluate(() => window.__game!.pressVirtualKey('ArrowRight'));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.__game!.releaseVirtualKey('ArrowRight'));
    const x1 = await page.evaluate(() => window.__game!.getPlayerX());
    expect(x1).toBeGreaterThan(x0 + 20);
  });

  test('virtualKey: tecla virtual Space faz pular', async ({ page }) => {
    await enterGameScene(page);
    await page.waitForFunction(() => window.__game!.isPlayerOnGround(), null, { timeout: 3000 });
    const y0 = await page.evaluate(() => window.__game!.getPlayerY());
    await page.evaluate(() => window.__game!.pressVirtualKey('Space'));
    await page.waitForTimeout(80);
    await page.evaluate(() => window.__game!.releaseVirtualKey('Space'));
    await page.waitForTimeout(50);
    const y1 = await page.evaluate(() => window.__game!.getPlayerY());
    expect(y1).toBeLessThan(y0 - 5);
  });

  test('viewport tablet (768x1024): TouchControls fica habilitado', async ({ browser }) => {
    const ctx = await browser.newContext({
      ...devices['iPad (gen 7)'],
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.keyboard.press('Enter').catch(() => {});
    await page.evaluate(() =>
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })),
    );
    await page.waitForFunction(() => !!window.__game, null, { timeout: 5000 });
    await page.waitForTimeout(300);
    const enabled = await page.evaluate(() => window.__game!.isTouchEnabled());
    expect(enabled).toBe(true);
    await ctx.close();
  });

  test('performance: delta médio ≤ 25ms (≥ 40fps) em 1.5s de jogo', async ({ page }) => {
    await enterGameScene(page);
    const samples: number[] = [];
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(100);
      const d = await page.evaluate(() => window.__game!.getDelta());
      samples.push(d);
    }
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(avg).toBeLessThanOrEqual(25);
  });

  test('configuração de volume persiste no localStorage', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => {
      const sound = (window as Window & { __sound?: { setMusicVolume: (v: number) => void } })
        .__sound;
      sound?.setMusicVolume(0.123);
    });
    await page.waitForTimeout(50);
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('toy-blaster-kid:sound'),
    );
    expect(stored).toBeTruthy();
    expect(stored!).toContain('0.123');
  });

  test('cena de jogo carrega música world1 no SoundSystem', async ({ page }) => {
    await enterGameScene(page);
    await page.waitForTimeout(200);
    const events = await page.evaluate(() => window.__game!.getSoundEvents());
    const musicKeys = events.filter((e) => e.type === 'music').map((e) => e.key);
    expect(musicKeys).toContain('bgm_world1');
  });

  test('transição Game Over: fadeToScene leva à GameOverScene', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => {
      const win = window as unknown as { __game: { forceGameOver: () => void } };
      win.__game.forceGameOver();
    });
    await page.waitForTimeout(500);
    const ended = await page.evaluate(() => !window.__game || window.__game.isGameEnded());
    expect(ended).toBe(true);
  });
});
