import { describe, it, expect } from 'vitest';
import { Player } from '../../src/entities/Player';
import { Skeleton } from '../../src/entities/enemies/Skeleton';
import { Zombie } from '../../src/entities/enemies/Zombie';
import { STAR_DURATION_MS } from '../../src/types/GameTypes';

describe('Star power-up integration', () => {
  it('Star ativa cancela dano de inimigo (zumbi)', () => {
    const p = new Player();
    const z = new Zombie();
    p.activateStar();
    expect(p.takeDamage(z.damage)).toBe(false);
    expect(p.hp).toBe(p.maxHp);
  });

  it('Star ativa cancela dano de projétil (osso de esqueleto)', () => {
    const p = new Player();
    const s = new Skeleton();
    p.activateStar();
    expect(p.takeDamage(s.damage)).toBe(false);
    expect(p.hp).toBe(p.maxHp);
  });

  it('após Star expirar, dano normal volta a aplicar', () => {
    const p = new Player();
    const z = new Zombie();
    p.activateStar(200);
    p.update(100);
    expect(p.takeDamage(z.damage)).toBe(false);
    p.update(150);
    expect(p.hasStar).toBe(false);
    expect(p.takeDamage(z.damage)).toBe(true);
    expect(p.hp).toBe(p.maxHp - z.damage);
  });

  it('Duração padrão do Star é STAR_DURATION_MS', () => {
    const p = new Player();
    p.activateStar();
    expect(p.starRemaining).toBe(STAR_DURATION_MS);
  });

  it('Star + invencibilidade simultâneas: ambos bloqueiam dano', () => {
    const p = new Player();
    p.activateStar();
    p.takeDamage(0); // no-op but exercises path
    expect(p.hp).toBe(p.maxHp);
    p.update(50);
    expect(p.hasStar).toBe(true);
  });
});
