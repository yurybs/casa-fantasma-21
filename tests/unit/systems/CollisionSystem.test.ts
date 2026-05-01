import { describe, it, expect } from 'vitest';
import { CollisionSystem } from '../../../src/systems/CollisionSystem';

describe('CollisionSystem', () => {
  it('intersects detecta sobreposição direta', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(CollisionSystem.intersects(a, b)).toBe(true);
  });

  it('intersects retorna false quando não há sobreposição', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 50, y: 50, width: 10, height: 10 };
    expect(CollisionSystem.intersects(a, b)).toBe(false);
  });

  it('intersects retorna false quando apenas tocam bordas', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(CollisionSystem.intersects(a, b)).toBe(false);
  });

  it('detecta sobreposição com b dentro de a', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 25, y: 25, width: 10, height: 10 };
    expect(CollisionSystem.intersects(a, b)).toBe(true);
  });

  it('isMovingDownAndAbove detecta passagem por plataforma', () => {
    expect(CollisionSystem.isMovingDownAndAbove(110, 95, 100)).toBe(true);
  });

  it('isMovingDownAndAbove ignora se já estava abaixo', () => {
    expect(CollisionSystem.isMovingDownAndAbove(110, 105, 100)).toBe(false);
  });

  it('distance retorna distância euclidiana', () => {
    expect(CollisionSystem.distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('withinRange retorna true dentro do range', () => {
    expect(
      CollisionSystem.withinRange({ x: 0, y: 0 }, { x: 100, y: 0 }, 200),
    ).toBe(true);
  });

  it('withinRange retorna false fora do range', () => {
    expect(
      CollisionSystem.withinRange({ x: 0, y: 0 }, { x: 300, y: 0 }, 200),
    ).toBe(false);
  });
});
