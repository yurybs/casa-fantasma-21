import { describe, it, expect, vi } from 'vitest';
import { GhostBoss } from '../../../src/entities/enemies/GhostBoss';

const stepUntilState = (
  boss: GhostBoss,
  predicate: () => boolean,
  playerX: number,
  playerY: number,
  maxMs = 10000,
  stepMs = 16,
): number => {
  let elapsed = 0;
  while (elapsed < maxMs && !predicate()) {
    boss.update(stepMs, playerX, playerY);
    elapsed += stepMs;
  }
  return elapsed;
};

describe('GhostBoss', () => {
  it('inicia com 8 HP em phase1 e estado float', () => {
    const boss = new GhostBoss(400, 200);
    expect(boss.hp).toBe(8);
    expect(boss.phase).toBe('phase1');
    expect(boss.state).toBe('float');
    expect(boss.tag).toBe('ghost');
  });

  it('flutua suavemente em torno do ponto de origem', () => {
    const boss = new GhostBoss(400, 200);
    const startX = boss.x;
    boss.update(800, 100, 100);
    expect(Math.abs(boss.vx) + Math.abs(boss.vy)).toBeGreaterThan(0);
    expect(Math.abs(boss.x - startX)).toBeLessThan(200);
  });

  it('entra em estado dash após o cooldown e emite evento onDashStart', () => {
    const onDashStart = vi.fn();
    const boss = new GhostBoss(400, 200, { onDashStart });
    boss.x = 400;
    boss.y = 200;
    stepUntilState(boss, () => boss.state === 'dash', 100, 200, 6000);
    expect(boss.state).toBe('dash');
    expect(onDashStart).toHaveBeenCalled();
  });

  it('dash mira o jogador (vx negativo se jogador à esquerda)', () => {
    const boss = new GhostBoss(400, 200);
    stepUntilState(boss, () => boss.state === 'dash', 100, 200, 6000);
    expect(boss.vx).toBeLessThan(0);
  });

  it('volta para float após dash + recover', () => {
    const boss = new GhostBoss(400, 200);
    stepUntilState(boss, () => boss.state === 'dash', 100, 200, 6000);
    stepUntilState(boss, () => boss.state === 'recover', 100, 200, 2000);
    stepUntilState(boss, () => boss.state === 'float', 100, 200, 2000);
    expect(boss.state).toBe('float');
  });

  it('a 50% HP entra em phase2 e dispara onPhaseChange + onSpawnMinis', () => {
    const onPhaseChange = vi.fn();
    const onSpawnMinis = vi.fn();
    const boss = new GhostBoss(400, 200, { onPhaseChange, onSpawnMinis });
    boss.takeDamage(GhostBoss.maxHp - GhostBoss.phase2HpThreshold);
    expect(boss.phase).toBe('phase2');
    expect(onPhaseChange).toHaveBeenCalledWith('phase2');
    expect(onSpawnMinis).toHaveBeenCalledTimes(1);
    const spawns = onSpawnMinis.mock.calls[0][0];
    expect(spawns).toHaveLength(2);
  });

  it('phase2 não duplica spawn de minis ao receber mais dano', () => {
    const onSpawnMinis = vi.fn();
    const boss = new GhostBoss(400, 200, { onSpawnMinis });
    boss.takeDamage(GhostBoss.maxHp - GhostBoss.phase2HpThreshold);
    boss.takeDamage(1);
    expect(onSpawnMinis).toHaveBeenCalledTimes(1);
  });

  it('morre quando HP chega a 0', () => {
    const boss = new GhostBoss(400, 200);
    boss.takeDamage(GhostBoss.maxHp);
    expect(boss.isDead).toBe(true);
    expect(boss.hp).toBe(0);
  });

  it('phase2 ataca mais rápido (menor cooldown de dash)', () => {
    const bossSlow = new GhostBoss(400, 200);
    const elapsedSlow = stepUntilState(
      bossSlow,
      () => bossSlow.state === 'dash',
      100,
      200,
      6000,
    );

    const bossFast = new GhostBoss(400, 200);
    bossFast.takeDamage(GhostBoss.maxHp - GhostBoss.phase2HpThreshold);
    // wait through dash + recover to get to next dash trigger
    stepUntilState(bossFast, () => bossFast.state === 'dash', 100, 200, 6000);
    stepUntilState(bossFast, () => bossFast.state === 'recover', 100, 200, 2000);
    stepUntilState(bossFast, () => bossFast.state === 'float', 100, 200, 2000);
    const elapsedFast = stepUntilState(
      bossFast,
      () => bossFast.state === 'dash',
      100,
      200,
      4000,
    );
    expect(elapsedFast).toBeLessThan(elapsedSlow);
  });

  it('ignora dano se isInvulnerable', () => {
    const boss = new GhostBoss(400, 200);
    boss.isInvulnerable = true;
    boss.takeDamage(5);
    expect(boss.hp).toBe(8);
  });

  it('boss morto não emite onSpawnMinis quando damage adicional chega', () => {
    const onSpawnMinis = vi.fn();
    const boss = new GhostBoss(400, 200, { onSpawnMinis });
    boss.takeDamage(GhostBoss.maxHp);
    expect(boss.isDead).toBe(true);
    boss.takeDamage(1);
    expect(onSpawnMinis).not.toHaveBeenCalled();
  });

  it('takeDamage retorna true apenas quando o boss morre', () => {
    const boss = new GhostBoss(400, 200);
    expect(boss.takeDamage(1)).toBe(false);
    expect(boss.takeDamage(GhostBoss.maxHp)).toBe(true);
  });
});
