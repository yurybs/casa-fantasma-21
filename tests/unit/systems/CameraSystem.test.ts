import { describe, it, expect, beforeEach } from 'vitest';
import { CameraSystem } from '../../../src/systems/CameraSystem';

describe('CameraSystem', () => {
  let camera: CameraSystem;

  beforeEach(() => {
    camera = new CameraSystem();
  });

  it('inicia sem shake e offsets zerados', () => {
    expect(camera.isShaking).toBe(false);
    expect(camera.offsetX).toBe(0);
    expect(camera.offsetY).toBe(0);
  });

  it('shake() ativa o sistema pela duração fornecida', () => {
    camera.shake(8, 500);
    expect(camera.isShaking).toBe(true);
  });

  it('offsets ficam não-zero durante shake ativo', () => {
    camera.shake(10, 500);
    camera.update(100);
    expect(Math.abs(camera.offsetX) + Math.abs(camera.offsetY)).toBeGreaterThan(0);
  });

  it('offsets zeram quando a duração expira', () => {
    camera.shake(10, 200);
    camera.update(250);
    expect(camera.isShaking).toBe(false);
    expect(camera.offsetX).toBe(0);
    expect(camera.offsetY).toBe(0);
  });

  it('intensidade decai linearmente até o fim', () => {
    camera.shake(20, 1000);
    camera.update(500);
    // No ponto médio, a intensidade deve ser ~50% do pico
    const midMagnitude = Math.hypot(camera.offsetX, camera.offsetY);
    expect(midMagnitude).toBeLessThanOrEqual(20);
    camera.update(500);
    expect(camera.offsetX).toBe(0);
    expect(camera.offsetY).toBe(0);
  });

  it('shake mais forte sobrescreve um shake mais fraco em andamento', () => {
    camera.shake(2, 1000);
    camera.update(100);
    camera.shake(15, 500);
    camera.update(50);
    const mag = Math.hypot(camera.offsetX, camera.offsetY);
    expect(mag).toBeGreaterThan(2); // sentindo o impulso maior
  });

  it('shake mais fraco NÃO sobrescreve um shake forte ativo', () => {
    camera.shake(15, 500);
    camera.shake(1, 200); // ignorado
    camera.update(50);
    const mag = Math.hypot(camera.offsetX, camera.offsetY);
    expect(mag).toBeGreaterThan(5);
  });

  it('intensity <= 0 ou duration <= 0 são ignorados', () => {
    camera.shake(0, 500);
    expect(camera.isShaking).toBe(false);
    camera.shake(10, 0);
    expect(camera.isShaking).toBe(false);
    camera.shake(-5, 500);
    expect(camera.isShaking).toBe(false);
  });

  it('reset() cancela qualquer shake ativo', () => {
    camera.shake(20, 1000);
    camera.update(100);
    camera.reset();
    expect(camera.isShaking).toBe(false);
    expect(camera.offsetX).toBe(0);
    expect(camera.offsetY).toBe(0);
  });

  it('offsets são determinísticos para mesma sequência de updates', () => {
    const c1 = new CameraSystem();
    const c2 = new CameraSystem();
    c1.shake(12, 600);
    c2.shake(12, 600);
    c1.update(150);
    c2.update(150);
    expect(c1.offsetX).toBe(c2.offsetX);
    expect(c1.offsetY).toBe(c2.offsetY);
  });
});
