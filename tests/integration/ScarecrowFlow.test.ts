import { describe, it, expect, vi } from 'vitest';
import { ScarecrowBoss } from '../../src/entities/enemies/ScarecrowBoss';
import { Crow } from '../../src/entities/enemies/Crow';
import { Direction } from '../../src/types/GameTypes';

describe('ScarecrowBoss flow: arm strikes + crow waves + sinusoidal flight', () => {
  it('corvos invocados pelo boss seguem padrão senoidal', () => {
    const spawnedCrows: Crow[] = [];
    const boss = new ScarecrowBoss(400, 200, {
      onSpawnCrows: (spawns) => {
        spawns.forEach((s) => spawnedCrows.push(new Crow(s.x, s.y, s.direction)));
      },
    });

    let elapsed = 0;
    while (spawnedCrows.length === 0 && elapsed < 8000) {
      boss.update(16, 100, 200);
      elapsed += 16;
    }
    expect(spawnedCrows.length).toBeGreaterThan(0);

    const c = spawnedCrows[0];
    const samples: number[] = [];
    let y = c.y;
    for (let t = 0; t < Crow.sinePeriodMs * 1.5; t += 50) {
      c.update(50, 200, 100);
      y += (c.vy * 50) / 1000;
      c.y = y;
      samples.push(y);
    }
    const max = Math.max(...samples);
    const min = Math.min(...samples);
    expect(max - min).toBeGreaterThan(Crow.sineAmplitude * 0.5);
  });

  it('arm strike emite onArmStrike com reach correto', () => {
    const onArmStrike = vi.fn();
    const boss = new ScarecrowBoss(400, 200, { onArmStrike });
    let elapsed = 0;
    while (onArmStrike.mock.calls.length === 0 && elapsed < 8000) {
      boss.update(16, 100, 200);
      elapsed += 16;
    }
    expect(onArmStrike).toHaveBeenCalled();
    const info = onArmStrike.mock.calls[0][0];
    expect(info.reach).toBe(ScarecrowBoss.armReachPx);
    expect([Direction.Left, Direction.Right]).toContain(info.direction);
  });

  it('phase2 spawna corvos mais frequentemente que phase1', () => {
    const phase1Spawns: number[] = [];
    const boss1 = new ScarecrowBoss(400, 200, {
      onSpawnCrows: () => phase1Spawns.push(0),
    });
    let t1 = 0;
    while (phase1Spawns.length < 2 && t1 < 30000) {
      boss1.update(50, 200, 200);
      t1 += 50;
    }

    const phase2Spawns: number[] = [];
    const boss2 = new ScarecrowBoss(400, 200, {
      onSpawnCrows: () => phase2Spawns.push(0),
    });
    boss2.takeDamage(ScarecrowBoss.maxHp - ScarecrowBoss.phase2HpThreshold);
    let t2 = 0;
    while (phase2Spawns.length < 2 && t2 < 30000) {
      boss2.update(50, 200, 200);
      t2 += 50;
    }

    expect(t2).toBeLessThan(t1);
  });
});
