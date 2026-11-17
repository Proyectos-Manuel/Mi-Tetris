export function haptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

export interface Particle {
  id: number;
  x: number; // col (0-1 fraction within board width)
  y: number; // row
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

let particleId = 0;

export function spawnParticlesForRow(row: number, colors: (string | null)[]): Particle[] {
  const particles: Particle[] = [];
  colors.forEach((color, col) => {
    if (!color) return;
    const count = 3;
    for (let i = 0; i < count; i++) {
      particles.push({
        id: particleId++,
        x: (col + Math.random()) / 10,
        y: row + Math.random(),
        vx: (Math.random() - 0.5) * 0.9,
        vy: -Math.random() * 1.4 - 0.2,
        color,
        size: 4 + Math.random() * 7,
        life: 1,
      });
    }
  });
  return particles;
}

export function stepParticles(particles: Particle[], dtMs: number): Particle[] {
  const dt = dtMs / 1000;
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + 4.5 * dt, // gravity
      life: p.life - dt * 1.4,
    }))
    .filter((p) => p.life > 0);
}
