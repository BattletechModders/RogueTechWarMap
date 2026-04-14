import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDistance, requestBatchDraw } from '../../src/components/hooks/canvasUtils';

describe('getDistance', () => {
  it('returns 0 for same position touches', () => {
    const touch = { clientX: 100, clientY: 200 } as Touch;
    expect(getDistance(touch, touch)).toBe(0);
  });

  it('calculates correct horizontal distance', () => {
    const t1 = { clientX: 0, clientY: 0 } as Touch;
    const t2 = { clientX: 100, clientY: 0 } as Touch;
    expect(getDistance(t1, t2)).toBe(100);
  });

  it('calculates correct vertical distance', () => {
    const t1 = { clientX: 0, clientY: 0 } as Touch;
    const t2 = { clientX: 0, clientY: 50 } as Touch;
    expect(getDistance(t1, t2)).toBe(50);
  });

  it('calculates correct diagonal distance (3-4-5 triangle)', () => {
    const t1 = { clientX: 0, clientY: 0 } as Touch;
    const t2 = { clientX: 3, clientY: 4 } as Touch;
    expect(getDistance(t1, t2)).toBe(5);
  });

  it('returns same distance regardless of order', () => {
    const t1 = { clientX: 10, clientY: 20 } as Touch;
    const t2 = { clientX: 40, clientY: 60 } as Touch;
    expect(getDistance(t1, t2)).toBe(getDistance(t2, t1));
  });

  it('handles negative coordinates', () => {
    const t1 = { clientX: -10, clientY: -10 } as Touch;
    const t2 = { clientX: -7, clientY: -6 } as Touch;
    expect(getDistance(t1, t2)).toBe(5);
  });
});

describe('requestBatchDraw', () => {
  let rafCallback: FrameRequestCallback | null = null;

  beforeEach(() => {
    rafCallback = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
  });

  it('calls batchDraw via requestAnimationFrame', () => {
    const mockStage = { batchDraw: vi.fn() } as any;
    requestBatchDraw(mockStage);

    // Before RAF fires, batchDraw not called yet
    expect(mockStage.batchDraw).not.toHaveBeenCalled();

    // Fire the RAF callback
    rafCallback!(0);
    expect(mockStage.batchDraw).toHaveBeenCalledOnce();
  });
});
