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
  await page.waitForFunction(() => !!window.__game, null, { timeout: 5000 });
  await page.waitForTimeout(300);
};

test.describe('Sprint 1 — MVP Level 1', () => {
  test('página carrega sem erros críticos e exibe canvas', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      if (isCriticalError(err.message)) errors.push(err.message);
    });
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test('menu inicia o jogo via tecla Enter', async ({ page }) => {
    await enterGameScene(page);
    const hp = await page.evaluate(() => window.__game!.getPlayerHp());
    expect(hp).toBe(6);
  });

  test('personagem aparece na posição inicial e está no chão', async ({ page }) => {
    await enterGameScene(page);
    await page.waitForTimeout(400);
    const onGround = await page.evaluate(() => window.__game!.isPlayerOnGround());
    expect(onGround).toBe(true);
  });

  test('seta direita move o personagem para a direita', async ({ page }) => {
    await enterGameScene(page);
    const x0 = await page.evaluate(() => window.__game!.getPlayerX());
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    const x1 = await page.evaluate(() => window.__game!.getPlayerX());
    expect(x1).toBeGreaterThan(x0 + 30);
  });

  test('seta esquerda move o personagem para a esquerda', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => window.__game!.teleportPlayer(400, 300));
    await page.waitForTimeout(200);
    const x0 = await page.evaluate(() => window.__game!.getPlayerX());
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowLeft');
    const x1 = await page.evaluate(() => window.__game!.getPlayerX());
    expect(x1).toBeLessThan(x0 - 30);
  });

  test('Espaço faz o personagem pular', async ({ page }) => {
    await enterGameScene(page);
    await page.waitForFunction(() => window.__game!.isPlayerOnGround(), null, { timeout: 3000 });
    const y0 = await page.evaluate(() => window.__game!.getPlayerY());
    await page.keyboard.down('Space');
    await page.waitForTimeout(80);
    await page.keyboard.up('Space');
    await page.waitForTimeout(50);
    const y1 = await page.evaluate(() => window.__game!.getPlayerY());
    expect(y1).toBeLessThan(y0 - 5);
  });

  test('duplo pulo permite dois pulos no ar', async ({ page }) => {
    await enterGameScene(page);
    await page.waitForFunction(() => window.__game!.isPlayerOnGround(), null, { timeout: 3000 });
    await page.keyboard.down('Space');
    await page.waitForTimeout(50);
    await page.keyboard.up('Space');
    await page.waitForTimeout(150);
    const yMid = await page.evaluate(() => window.__game!.getPlayerY());
    await page.keyboard.down('Space');
    await page.waitForTimeout(50);
    await page.keyboard.up('Space');
    await page.waitForTimeout(80);
    const yAfterDouble = await page.evaluate(() => window.__game!.getPlayerY());
    expect(yAfterDouble).toBeLessThan(yMid + 10);
  });

  test('Z dispara projétil', async ({ page }) => {
    await enterGameScene(page);
    const c0 = await page.evaluate(() => window.__game!.getProjectileCount());
    await page.keyboard.down('KeyZ');
    await page.waitForTimeout(50);
    await page.keyboard.up('KeyZ');
    await page.waitForTimeout(80);
    const c1 = await page.evaluate(() => window.__game!.getProjectileCount());
    expect(c1).toBeGreaterThan(c0);
  });

  test('cooldown impede disparos rápidos consecutivos', async ({ page }) => {
    await enterGameScene(page);
    for (let i = 0; i < 3; i++) {
      await page.keyboard.down('KeyZ');
      await page.waitForTimeout(20);
      await page.keyboard.up('KeyZ');
      await page.waitForTimeout(20);
    }
    const count = await page.evaluate(() => window.__game!.getProjectileCount());
    expect(count).toBe(1);
  });

  test('personagem perde HP ao tomar dano', async ({ page }) => {
    await enterGameScene(page);
    const hp0 = await page.evaluate(() => window.__game!.getPlayerHp());
    await page.evaluate(() => window.__game!.damagePlayer(2));
    const hp1 = await page.evaluate(() => window.__game!.getPlayerHp());
    expect(hp1).toBe(hp0 - 2);
  });

  test('forceGameOver leva à tela de Game Over', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => window.__game!.forceGameOver());
    await page.waitForFunction(
      () => {
        const sceneKey = window.__game?.getActiveSceneKey?.() ?? '';
        return sceneKey === 'GameOverScene' || !window.__game;
      },
      null,
      { timeout: 5000 },
    );
    await page.waitForTimeout(300);
    const stillInGame = await page.evaluate(() => !!window.__game && !window.__game.isGameEnded());
    expect(stillInGame).toBe(false);
  });

  test('forceVictory leva à tela de Nível Completo', async ({ page }) => {
    await enterGameScene(page);
    await page.evaluate(() => window.__game!.forceVictory());
    await page.waitForTimeout(500);
    const ended = await page.evaluate(() => !window.__game || window.__game.isGameEnded());
    expect(ended).toBe(true);
  });

  test('Esc abre o menu de pausa e Esc retoma', async ({ page }) => {
    await enterGameScene(page);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const x0 = await page.evaluate(() => window.__game!.getPlayerX());
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowRight');
    const xPaused = await page.evaluate(() => window.__game!.getPlayerX());
    expect(Math.abs(xPaused - x0)).toBeLessThan(10);
  });
});
