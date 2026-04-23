import { describe, it, expect } from 'vitest';
import { getDistance } from './gm.interactions';

describe('getDistance', () => {
  it('returns 0 for identical points', () => {
    const t1 = { clientX: 100, clientY: 200 } as unknown as Touch;
    const t2 = { clientX: 100, clientY: 200 } as unknown as Touch;

    expect(getDistance(t1, t2)).toBe(0);
  });

  it('computes Euclidean distance between two touch points (3-4-5 triangle)', () => {
    const t1 = { clientX: 0, clientY: 0 } as unknown as Touch;
    const t2 = { clientX: 3, clientY: 4 } as unknown as Touch;

    expect(getDistance(t1, t2)).toBe(5);
  });

  it('is symmetric (distance A→B equals distance B→A)', () => {
    const t1 = { clientX: 10, clientY: 20 } as unknown as Touch;
    const t2 = { clientX: -5, clientY: 7 } as unknown as Touch;

    expect(getDistance(t1, t2)).toBeCloseTo(getDistance(t2, t1), 10);
  });

  it('handles negative coordinates', () => {
    const t1 = { clientX: -10, clientY: -10 } as unknown as Touch;
    const t2 = { clientX: -7, clientY: -6 } as unknown as Touch;

    expect(getDistance(t1, t2)).toBe(5);
  });
});
