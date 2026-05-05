import { describe, it, expect } from 'vitest';
import { Crow } from '../../../src/entities/enemies/Crow';
import { Direction } from '../../../src/types/GameTypes';

describe('Crow', () => {
  it('inicia com 1 HP e tag normal', () => {
    const c = new Crow(200, 100);
    expect(c.hp).toBe(1);
    expect(c.tag).toBe('normal');
  });

  it('voa horizontalmente na direção configurada', () => {
    const cLeft = new Crow(200, 100, Direction.Left);
    cLeft.update(16, 200, 100);
    expect(cLeft.vx).toBeLessThan(0);

    const cRight = new Crow(200, 100, Direction.Right);
    cRight.update(16, 200, 100);
    expect(cRight.vx).toBeGreaterThan(0);
  });

  it('movimento vertical segue padrão senoidal em torno do anchor Y', () => {
    const c = new Crow(200, 100);
    const samples: number[] = [];
    let y = 100;
    for (let t = 0; t < Crow.sinePeriodMs; t += 50) {
      c.update(50, 200, 100);
      // simulate physics step
      y += (c.vy * 50) / 1000;
      c.y = y;
      samples.push(y);
    }
    const max = Math.max(...samples);
    const min = Math.min(...samples);
    const expectedRange = Crow.sineAmplitude * 1.5;
    expect(max - min).toBeGreaterThan(expectedRange * 0.5);
    expect(max - min).toBeLessThan(expectedRange * 2);
  });

  it('amplitude e período são valores estáticos publicados', () => {
    expect(Crow.sineAmplitude).toBeGreaterThan(0);
    expect(Crow.sinePeriodMs).toBeGreaterThan(0);
  });

  it('morre com 1 de dano', () => {
    const c = new Crow(200, 100);
    c.takeDamage(1);
    expect(c.isDead).toBe(true);
  });

  it('morto zera velocidade', () => {
    const c = new Crow(200, 100);
    c.takeDamage(1);
    c.update(16, 300, 200);
    expect(c.vx).toBe(0);
    expect(c.vy).toBe(0);
  });
});
