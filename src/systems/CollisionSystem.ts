export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CollisionSystem = {
  intersects(a: AABB, b: AABB): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  },

  isMovingDownAndAbove(playerBottom: number, prevPlayerBottom: number, platformTop: number): boolean {
    return prevPlayerBottom <= platformTop && playerBottom >= platformTop;
  },

  distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  withinRange(a: { x: number; y: number }, b: { x: number; y: number }, range: number): boolean {
    return this.distance(a, b) <= range;
  },
};
