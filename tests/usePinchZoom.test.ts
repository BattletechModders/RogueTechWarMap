import { describe, it, expect } from 'vitest';

const JITTER_THRESHOLD = 0.02;
const FRAME_CLAMP_MIN = 0.9;
const FRAME_CLAMP_MAX = 1.1;
const MIN_SCALE = 0.2;
const MAX_SCALE = 25;

// Scale math extracted from usePinchZoom.onTouchMove (inside the rAF callback).
// Returns { skipped: true } when the delta is within the jitter deadband.
const calcPinchScale = (
  newDistance: number,
  lastDistance: number,
  oldScale: number,
  minScale = MIN_SCALE,
  maxScale = MAX_SCALE
): { skipped: boolean; newScale: number } => {
  let scaleBy = newDistance / lastDistance;

  if (Math.abs(1 - scaleBy) < JITTER_THRESHOLD) {
    return { skipped: true, newScale: oldScale };
  }

  scaleBy = Math.max(FRAME_CLAMP_MIN, Math.min(FRAME_CLAMP_MAX, scaleBy));
  const newScale = Math.max(minScale, Math.min(maxScale, oldScale * scaleBy));

  return { skipped: false, newScale };
};

// Position math extracted from usePinchZoom.onTouchMove.
// Keeps the world point under the pinch centre fixed after the scale change.
const calcPinchPosition = (
  pinchCenterX: number,
  pinchCenterY: number,
  stageX: number,
  stageY: number,
  stageScale: number,
  newScale: number
) => {
  const worldPos = {
    x: (pinchCenterX - stageX) / stageScale,
    y: (pinchCenterY - stageY) / stageScale,
  };
  return {
    x: pinchCenterX - worldPos.x * newScale,
    y: pinchCenterY - worldPos.y * newScale,
  };
};

describe('usePinchZoom scale math', () => {
  describe('jitter deadband', () => {
    it('skips updates within the ±0.02 threshold (ratio ≈ 0.99)', () => {
      // 100/101 ≈ 0.99 → |1 - 0.99| = 0.0099 < 0.02 → skip
      expect(calcPinchScale(100, 101, 1).skipped).toBe(true);
    });

    it('skips updates within the ±0.02 threshold (ratio ≈ 1.01)', () => {
      // 101/100 = 1.01 → |1 - 1.01| = 0.01 < 0.02 → skip
      expect(calcPinchScale(101, 100, 1).skipped).toBe(true);
    });

    it('processes updates outside the threshold (ratio = 1.2)', () => {
      // 120/100 = 1.2 → |1 - 1.2| = 0.2 ≥ 0.02 → process
      expect(calcPinchScale(120, 100, 1).skipped).toBe(false);
    });

    it('processes updates outside the threshold (ratio = 0.8)', () => {
      expect(calcPinchScale(80, 100, 1).skipped).toBe(false);
    });

    it('exactly 0.02 delta is NOT skipped (strict less-than check)', () => {
      // ratio = 0.98 → |1 - 0.98| = 0.02, not < 0.02 → processed
      expect(calcPinchScale(98, 100, 1).skipped).toBe(false);
    });
  });

  describe('per-frame scale clamp', () => {
    it('clamps large pinch-out (ratio 2.0) to FRAME_CLAMP_MAX of 1.1', () => {
      const { newScale } = calcPinchScale(200, 100, 1);
      expect(newScale).toBeCloseTo(1.1);
    });

    it('clamps large pinch-in (ratio 0.25) to FRAME_CLAMP_MIN of 0.9', () => {
      const { newScale } = calcPinchScale(50, 200, 1);
      expect(newScale).toBeCloseTo(0.9);
    });

    it('moderate pinch-out (ratio 1.05) is not clamped', () => {
      const { newScale } = calcPinchScale(105, 100, 1);
      expect(newScale).toBeCloseTo(1.05);
    });

    it('accumulates zoom correctly across multiple frames at max step', () => {
      let scale = 1;
      for (let i = 0; i < 10; i++) {
        const result = calcPinchScale(110, 100, scale);
        scale = result.newScale;
      }
      expect(scale).toBeCloseTo(1.1 ** 10, 5);
    });
  });

  describe('min/max scale bounds', () => {
    it('does not exceed MAX_SCALE when already at the ceiling', () => {
      const { newScale } = calcPinchScale(200, 100, MAX_SCALE);
      expect(newScale).toBe(MAX_SCALE);
    });

    it('does not go below MIN_SCALE when already at the floor', () => {
      const { newScale } = calcPinchScale(50, 200, MIN_SCALE);
      expect(newScale).toBe(MIN_SCALE);
    });

    it('approaches MAX_SCALE asymptotically but never exceeds it', () => {
      let scale = MAX_SCALE * 0.9;
      for (let i = 0; i < 20; i++) {
        const result = calcPinchScale(110, 100, scale);
        scale = result.newScale;
        expect(scale).toBeLessThanOrEqual(MAX_SCALE);
      }
    });
  });
});

describe('usePinchZoom position math', () => {
  it('keeps the world point under the pinch centre fixed after scale change', () => {
    const pinchCenterX = 400;
    const pinchCenterY = 300;
    const stageX = 0;
    const stageY = 0;
    const stageScale = 1;
    const newScale = 1.1;

    const newPos = calcPinchPosition(
      pinchCenterX,
      pinchCenterY,
      stageX,
      stageY,
      stageScale,
      newScale
    );

    const worldXBefore = (pinchCenterX - stageX) / stageScale;
    const worldYBefore = (pinchCenterY - stageY) / stageScale;
    const worldXAfter = (pinchCenterX - newPos.x) / newScale;
    const worldYAfter = (pinchCenterY - newPos.y) / newScale;

    expect(worldXAfter).toBeCloseTo(worldXBefore);
    expect(worldYAfter).toBeCloseTo(worldYBefore);
  });

  it('invariant holds when the stage is already panned and scaled', () => {
    const newPos = calcPinchPosition(300, 200, -100, -80, 2, 2.2);

    const worldXBefore = (300 - -100) / 2;
    const worldXAfter = (300 - newPos.x) / 2.2;

    expect(worldXAfter).toBeCloseTo(worldXBefore);
  });

  it('invariant holds for a pinch-out (new scale larger) and pinch-in (new scale smaller)', () => {
    for (const [stageScale, newScale] of [
      [1, 1.1],
      [2, 1.8],
      [0.5, 0.55],
    ]) {
      const newPos = calcPinchPosition(500, 400, 100, 50, stageScale, newScale);
      const worldXBefore = (500 - 100) / stageScale;
      const worldXAfter = (500 - newPos.x) / newScale;
      expect(worldXAfter).toBeCloseTo(worldXBefore, 8);
    }
  });

  it('position is unchanged when new scale equals stage scale (no-op zoom)', () => {
    const stageX = 100;
    const stageY = 80;
    const scale = 2;
    const newPos = calcPinchPosition(400, 300, stageX, stageY, scale, scale);
    expect(newPos.x).toBeCloseTo(stageX);
    expect(newPos.y).toBeCloseTo(stageY);
  });
});
