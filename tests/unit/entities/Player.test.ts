import { describe, it, expect, vi } from 'vitest';
import { Player } from '../../../src/entities/Player';
import { Direction, DEFAULT_PLAYER_STATS } from '../../../src/types/GameTypes';

describe('Player', () => {
  it('inicia com 6 HP e 3 vidas', () => {
    const p = new Player();
    expect(p.hp).toBe(6);
    expect(p.maxHp).toBe(6);
    expect(p.lives).toBe(3);
    expect(p.coins).toBe(0);
  });

  it('takeDamage() reduz HP corretamente', () => {
    const p = new Player();
    p.takeDamage(2);
    expect(p.hp).toBe(4);
  });

  it('HP não vai abaixo de 0', () => {
    const p = new Player();
    p.takeDamage(100);
    expect(p.hp).toBe(0);
  });

  it('HP 0 aciona morte e reduz vida', () => {
    const onLifeLost = vi.fn();
    const onDeath = vi.fn();
    const p = new Player({ onLifeLost, onDeath });
    p.takeDamage(6);
    expect(p.isDead).toBe(true);
    expect(p.lives).toBe(2);
    expect(onDeath).toHaveBeenCalled();
    expect(onLifeLost).toHaveBeenCalledWith(2);
  });

  it('Game Over ao chegar a 0 vidas', () => {
    const onGameOver = vi.fn();
    const p = new Player({ onGameOver }, { ...DEFAULT_PLAYER_STATS, startingLives: 1 });
    p.takeDamage(6);
    expect(onGameOver).toHaveBeenCalled();
    expect(p.lives).toBe(0);
  });

  it('invencibilidade ativa por 1500ms após dano', () => {
    const p = new Player();
    p.takeDamage(1);
    expect(p.isInvincible).toBe(true);
    expect(p.invincibilityRemaining).toBe(1500);
  });

  it('não toma dano durante invencibilidade', () => {
    const p = new Player();
    p.takeDamage(1);
    const hpAfterFirst = p.hp;
    const damaged = p.takeDamage(1);
    expect(damaged).toBe(false);
    expect(p.hp).toBe(hpAfterFirst);
  });

  it('invencibilidade expira após o tempo configurado', () => {
    const p = new Player();
    p.takeDamage(1);
    p.update(1500);
    expect(p.isInvincible).toBe(false);
  });

  it('respawn restaura HP e mantém vidas', () => {
    const p = new Player();
    p.takeDamage(6);
    expect(p.hp).toBe(0);
    p.respawn();
    expect(p.hp).toBe(6);
    expect(p.isDead).toBe(false);
  });

  it('startJump() retorna true no primeiro pulo', () => {
    const p = new Player();
    expect(p.startJump()).toBe(true);
    expect(p.jumpsUsed).toBe(1);
    expect(p.vy).toBeLessThan(0);
  });

  it('duplo pulo disponível após pulo simples', () => {
    const p = new Player();
    p.startJump();
    expect(p.startJump()).toBe(true);
    expect(p.jumpsUsed).toBe(2);
  });

  it('duplo pulo não permite terceiro pulo', () => {
    const p = new Player();
    p.startJump();
    p.startJump();
    expect(p.startJump()).toBe(false);
  });

  it('jumpsUsed resetado ao tocar o chão', () => {
    const p = new Player();
    p.startJump();
    p.startJump();
    p.landOnGround();
    expect(p.jumpsUsed).toBe(0);
    expect(p.isOnGround).toBe(true);
    expect(p.startJump()).toBe(true);
  });

  it('hold jump aumenta velocidade vertical até o limite', () => {
    const p = new Player();
    p.startJump();
    const initialVy = p.vy;
    p.holdJump(100);
    expect(p.vy).toBeLessThan(initialVy);
  });

  it('hold jump para de acelerar após o tempo máximo', () => {
    const p = new Player();
    p.startJump();
    p.holdJump(300);
    const vyAfterHold = p.vy;
    p.holdJump(100);
    expect(p.vy).toBe(vyAfterHold);
  });

  it('releaseJump interrompe boost de pulo variável', () => {
    const p = new Player();
    p.startJump();
    p.releaseJump();
    expect(p.isHoldingJump).toBe(false);
  });

  it('moveHorizontal acelera para a direita', () => {
    const p = new Player();
    p.moveHorizontal(Direction.Right, 16);
    expect(p.vx).toBeGreaterThan(0);
    expect(p.facing).toBe(Direction.Right);
  });

  it('moveHorizontal acelera para a esquerda', () => {
    const p = new Player();
    p.moveHorizontal(Direction.Left, 16);
    expect(p.vx).toBeLessThan(0);
    expect(p.facing).toBe(Direction.Left);
  });

  it('moveHorizontal sem direção aplica fricção', () => {
    const p = new Player();
    p.vx = 100;
    p.moveHorizontal(0, 16);
    expect(Math.abs(p.vx)).toBeLessThan(100);
  });

  it('vx limitado pela velocidade máxima', () => {
    const p = new Player();
    for (let i = 0; i < 30; i++) p.moveHorizontal(Direction.Right, 16);
    expect(p.vx).toBeLessThanOrEqual(DEFAULT_PLAYER_STATS.moveSpeed);
  });

  it('collectCoin() incrementa contador', () => {
    const p = new Player();
    p.collectCoin();
    expect(p.coins).toBe(1);
  });

  it('100 moedas concedem 1 vida extra', () => {
    const onExtraLife = vi.fn();
    const p = new Player({ onExtraLife });
    for (let i = 0; i < 100; i++) p.collectCoin();
    expect(p.lives).toBe(4);
    expect(onExtraLife).toHaveBeenCalledWith(4);
  });

  it('canShoot retorna true por padrão', () => {
    const p = new Player();
    expect(p.canShoot()).toBe(true);
  });

  it('shoot() ativa cooldown e impede próximo disparo imediato', () => {
    const p = new Player();
    expect(p.shoot()).toBe(true);
    expect(p.canShoot()).toBe(false);
    expect(p.shoot()).toBe(false);
  });

  it('cooldown expira e permite novo disparo', () => {
    const p = new Player();
    p.shoot();
    p.update(300);
    expect(p.canShoot()).toBe(true);
  });

  it('jogador morto não pode pular', () => {
    const p = new Player();
    p.takeDamage(6);
    expect(p.startJump()).toBe(false);
  });

  it('jogador morto não pode atirar', () => {
    const p = new Player();
    p.takeDamage(6);
    expect(p.canShoot()).toBe(false);
  });

  it('takeDamage com 0 retorna false', () => {
    const p = new Player();
    expect(p.takeDamage(0)).toBe(false);
    expect(p.hp).toBe(6);
  });

  describe('Sprint 4 — Star power-up', () => {
    it('hasStar é falso por padrão', () => {
      const p = new Player();
      expect(p.hasStar).toBe(false);
    });

    it('activateStar liga a flag e dispara onStarStart', () => {
      const onStarStart = vi.fn();
      const p = new Player({ onStarStart });
      p.activateStar(5000);
      expect(p.hasStar).toBe(true);
      expect(p.starRemaining).toBe(5000);
      expect(onStarStart).toHaveBeenCalled();
    });

    it('reativar Star refresca o timer mas não dispara onStarStart de novo', () => {
      const onStarStart = vi.fn();
      const p = new Player({ onStarStart });
      p.activateStar(2000);
      p.activateStar(5000);
      expect(p.starRemaining).toBe(5000);
      expect(onStarStart).toHaveBeenCalledTimes(1);
    });

    it('takeDamage é ignorado enquanto Star está ativa', () => {
      const p = new Player();
      p.activateStar(1000);
      const result = p.takeDamage(2);
      expect(result).toBe(false);
      expect(p.hp).toBe(p.maxHp);
    });

    it('Star expira após o tempo configurado e dispara onStarEnd', () => {
      const onStarEnd = vi.fn();
      const p = new Player({ onStarEnd });
      p.activateStar(500);
      p.update(300);
      expect(p.hasStar).toBe(true);
      p.update(300);
      expect(p.hasStar).toBe(false);
      expect(onStarEnd).toHaveBeenCalled();
    });

    it('após Star expirar, takeDamage funciona normalmente', () => {
      const p = new Player();
      p.activateStar(100);
      p.update(150);
      expect(p.takeDamage(2)).toBe(true);
      expect(p.hp).toBe(p.maxHp - 2);
    });
  });

  describe('Sprint 4 — Extra Heart', () => {
    it('addExtraHeart aumenta maxHp em 2 e cura ao máximo', () => {
      const p = new Player();
      p.takeDamage(2);
      expect(p.hp).toBe(4);
      p.addExtraHeart();
      expect(p.maxHp).toBe(8);
      expect(p.hp).toBe(8);
    });

    it('onMaxHpIncreased é chamado com o novo maxHp', () => {
      const onMaxHpIncreased = vi.fn();
      const p = new Player({ onMaxHpIncreased });
      p.addExtraHeart();
      expect(onMaxHpIncreased).toHaveBeenCalledWith(8);
    });

    it('múltiplos extraHearts acumulam', () => {
      const p = new Player();
      p.addExtraHeart();
      p.addExtraHeart();
      expect(p.maxHp).toBe(10);
      expect(p.hp).toBe(10);
    });
  });

  describe('Sprint 5 — NerfRifle', () => {
    it('inicia sem nerfRifle', () => {
      const p = new Player();
      expect(p.hasNerfRifle).toBe(false);
      expect(p.nerfRifleRemaining).toBe(0);
    });

    it('activateNerfRifle ativa o estado e dispara onNerfRifleStart', () => {
      const onNerfRifleStart = vi.fn();
      const p = new Player({ onNerfRifleStart });
      p.activateNerfRifle();
      expect(p.hasNerfRifle).toBe(true);
      expect(onNerfRifleStart).toHaveBeenCalledTimes(1);
    });

    it('nerfRifleRemaining decai com o tempo e dispara onNerfRifleEnd', () => {
      const onNerfRifleEnd = vi.fn();
      const p = new Player({ onNerfRifleEnd });
      p.activateNerfRifle(1000);
      p.update(500);
      expect(p.hasNerfRifle).toBe(true);
      p.update(600);
      expect(p.hasNerfRifle).toBe(false);
      expect(onNerfRifleEnd).toHaveBeenCalledTimes(1);
    });

    it('reativar não emite onNerfRifleStart duas vezes', () => {
      const onNerfRifleStart = vi.fn();
      const p = new Player({ onNerfRifleStart });
      p.activateNerfRifle(1000);
      p.activateNerfRifle(1000); // refresh
      expect(onNerfRifleStart).toHaveBeenCalledTimes(1);
      expect(p.nerfRifleRemaining).toBe(1000);
    });
  });
});
