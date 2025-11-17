import { describe, it, expect } from 'vitest';
import { getDistance } from '../src/components/GalaxyMap/gm.interactions';

describe('getDistance', () => {
  it('returns 0 for identical points', () => {
    const t1 = { clientX: 100, clientY: 200 } as unknown as Touch;
    const t2 = { clientX: 100, clientY: 200 } as unknown as Touch;

    const d = getDistance(t1, t2);

    expect(d).toBe(0);
  });

  it('computes Euclidean distance between two touch points', () => {
    const t1 = { clientX: 0, clientY: 0 } as unknown as Touch;
    const t2 = { clientX: 3, clientY: 4 } as unknown as Touch;

    const d = getDistance(t1, t2);

    // 3-4-5 triangle
    expect(d).toBe(5);
  });

  it('is symmetric (distance A→B equals distance B→A)', () => {
    const t1 = { clientX: 10, clientY: 20 } as unknown as Touch;
    const t2 = { clientX: -5, clientY: 7 } as unknown as Touch;

    const d1 = getDistance(t1, t2);
    const d2 = getDistance(t2, t1);

    expect(d1).toBeCloseTo(d2, 10);
  });
});
