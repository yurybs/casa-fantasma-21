import { describe, it, expect, vi } from 'vitest';
import { VampireBoss, BatSpawn, MiniVampireSpawn } from '../../../src/entities/enemies/VampireBoss';

const stepUntil = (
  boss: VampireBoss,
  predicate: () => boolean,
  maxMs = 30000,
  stepMs = 16,
  playerX = 200,
  playerY = 300,
): number => {
  let elapsed = 0;
  while (elapsed < maxMs && !predicate()) {
    boss.update(stepMs, playerX, playerY);
    elapsed += stepMs;
  }
  return elapsed;
};

describe('VampireBoss', () => {
  it('inicia em phase1, hovering, HP máximo e tag ghost (fraqueza à água)', () => {
    const b = new VampireBoss(400, 120);
    expect(b.phase).toBe('phase1');
    expect(b.state).toBe('hovering');
    expect(b.hp).toBe(VampireBoss.maxHpValue);
    expect(b.tag).toBe('ghost');
    expect(b.damage).toBe(2);
    expect(b.isLifestealBlocked).toBe(false);
  });

  it('flutua com vx e bob vertical em phase 1', () => {
    const b = new VampireBoss(400, 120);
    b.update(16, 200, 300);
    expect(b.vx).not.toBe(0);
    expect(Math.abs(b.vx)).toBe(VampireBoss.hoverSpeed);
  });

  it('lança morcegos periodicamente via onSpawnBats', () => {
    const onSpawnBats = vi.fn();
    const b = new VampireBoss(400, 120, { onSpawnBats });
    stepUntil(b, () => onSpawnBats.mock.calls.length > 0);
    expect(onSpawnBats).toHaveBeenCalled();
    const spawns: BatSpawn[] = onSpawnBats.mock.calls[0][0];
    expect(spawns).toHaveLength(2);
  });

  it('lifesteal: recupera HP a cada 3 acertos no jogador', () => {
    const onLifesteal = vi.fn();
    const b = new VampireBoss(400, 120, { onLifesteal });
    b.takeDamage(4);
    const hpBefore = b.hp;

    b.registerHitOnPlayer();
    b.registerHitOnPlayer();
    expect(b.hp).toBe(hpBefore);
    expect(onLifesteal).not.toHaveBeenCalled();

    b.registerHitOnPlayer();
    expect(b.hp).toBe(hpBefore + VampireBoss.lifestealAmount);
    expect(onLifesteal).toHaveBeenCalledWith(VampireBoss.lifestealAmount, hpBefore + VampireBoss.lifestealAmount);
  });

  it('lifesteal não ultrapassa o HP máximo', () => {
    const b = new VampireBoss(400, 120);
    b.takeDamage(1);
    for (let i = 0; i < VampireBoss.hitsPerLifesteal; i++) b.registerHitOnPlayer();
    expect(b.hp).toBe(VampireBoss.maxHpValue);
  });

  it('lifesteal em HP cheio não emite onLifesteal', () => {
    const onLifesteal = vi.fn();
    const b = new VampireBoss(400, 120, { onLifesteal });
    for (let i = 0; i < VampireBoss.hitsPerLifesteal; i++) b.registerHitOnPlayer();
    expect(onLifesteal).not.toHaveBeenCalled();
    expect(b.hp).toBe(VampireBoss.maxHpValue);
  });

  it('blockLifesteal suprime lifesteal por 5s e emite onLifestealBlocked', () => {
    const onLifestealBlocked = vi.fn();
    const b = new VampireBoss(400, 120, { onLifestealBlocked });
    b.takeDamage(4);
    const hpBefore = b.hp;

    b.blockLifesteal();
    expect(b.isLifestealBlocked).toBe(true);
    expect(onLifestealBlocked).toHaveBeenCalledWith(VampireBoss.lifestealBlockMs);

    // Hits during the block don't count nor heal
    for (let i = 0; i < 6; i++) b.registerHitOnPlayer();
    expect(b.hp).toBe(hpBefore);
    expect(b.lifestealHitCount).toBe(0);
  });

  it('bloqueio de lifesteal expira após a duração', () => {
    const b = new VampireBoss(400, 120);
    b.blockLifesteal();
    expect(b.isLifestealBlocked).toBe(true);
    // Simulate a bit more than the block duration
    stepUntil(b, () => !b.isLifestealBlocked, VampireBoss.lifestealBlockMs + 1000);
    expect(b.isLifestealBlocked).toBe(false);
  });

  it('transição phase1→phase2 em HP <= 50% com spawn de 2 MiniVampires', () => {
    const onPhaseChange = vi.fn();
    const onSpawnMiniVampires = vi.fn();
    const b = new VampireBoss(400, 120, { onPhaseChange, onSpawnMiniVampires });
    b.takeDamage(VampireBoss.maxHpValue - VampireBoss.phase2HpThreshold);
    expect(b.phase).toBe('phase2');
    expect(onPhaseChange).toHaveBeenCalledWith('phase2');
    const spawns: MiniVampireSpawn[] = onSpawnMiniVampires.mock.calls[0][0];
    expect(spawns).toHaveLength(2);
  });

  it('mini vampiros spawnam uma única vez', () => {
    const onSpawnMiniVampires = vi.fn();
    const b = new VampireBoss(400, 120, { onSpawnMiniVampires });
    b.takeDamage(VampireBoss.maxHpValue - VampireBoss.phase2HpThreshold);
    expect(onSpawnMiniVampires).toHaveBeenCalledTimes(1);
    b.takeDamage(2);
    expect(onSpawnMiniVampires).toHaveBeenCalledTimes(1);
  });

  it('phase 2 é 3x mais rápido no hover', () => {
    const b = new VampireBoss(400, 120);
    b.takeDamage(VampireBoss.maxHpValue - VampireBoss.phase2HpThreshold);
    b.update(16, 200, 300);
    expect(Math.abs(b.vx)).toBe(VampireBoss.hoverSpeed * VampireBoss.phase2SpeedMultiplier);
  });

  it('phase 2 entra em swooping na direção do jogador', () => {
    const b = new VampireBoss(400, 120);
    b.takeDamage(VampireBoss.maxHpValue - VampireBoss.phase2HpThreshold);
    stepUntil(b, () => b.state === 'swooping', 30000, 16, 100, 340);
    expect(b.state).toBe('swooping');
    // Player is below and to the left → vy positive (downward), vx negative
    expect(b.vy).toBeGreaterThan(0);
    expect(b.vx).toBeLessThan(0);
  });

  it('após swoop retorna ao hover (returning → hovering)', () => {
    const b = new VampireBoss(400, 120);
    b.takeDamage(VampireBoss.maxHpValue - VampireBoss.phase2HpThreshold);
    stepUntil(b, () => b.state === 'swooping', 30000, 16, 100, 340);
    stepUntil(b, () => b.state === 'returning', 10000, 16, 100, 340);
    expect(b.state).toBe('returning');
    stepUntil(b, () => b.state === 'hovering', 10000, 16, 100, 340);
    expect(b.state).toBe('hovering');
  });

  it('morto zera velocidades e ignora lifesteal/bloqueio', () => {
    const onLifestealBlocked = vi.fn();
    const b = new VampireBoss(400, 120, { onLifestealBlocked });
    b.takeDamage(VampireBoss.maxHpValue);
    expect(b.isDead).toBe(true);
    b.update(16, 200, 300);
    expect(b.vx).toBe(0);
    expect(b.vy).toBe(0);
    b.registerHitOnPlayer();
    b.registerHitOnPlayer();
    b.registerHitOnPlayer();
    expect(b.hp).toBe(0);
    b.blockLifesteal();
    expect(onLifestealBlocked).not.toHaveBeenCalled();
  });
});
