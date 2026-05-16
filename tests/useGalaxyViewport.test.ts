import { describe, it, expect } from 'vitest';

const SCALE_BY = 1.25;
const MIN_SCALE = 0.2;
const MAX_SCALE = 25;

// Wheel zoom math extracted from useGalaxyViewport.onWheel.
// Returns the new scale and the updated stage position that keeps the
// world point under the pointer fixed.
const calcWheelZoom = (
  deltaY: number,
  oldScale: number,
  pointerX: number,
  pointerY: number,
  stageX: number,
  stageY: number,
  minScale = MIN_SCALE,
  maxScale = MAX_SCALE
) => {
  let newScale = deltaY > 0 ? oldScale / SCALE_BY : oldScale * SCALE_BY;
  newScale = Math.max(minScale, Math.min(maxScale, newScale));

  const mousePointTo = {
    x: (pointerX - stageX) / oldScale,
    y: (pointerY - stageY) / oldScale,
  };

  const newPosition = {
    x: pointerX - mousePointTo.x * newScale,
    y: pointerY - mousePointTo.y * newScale,
  };

  return { newScale, newPosition };
};

describe('useGalaxyViewport wheel zoom math', () => {
  describe('scale direction', () => {
    it('zooms in (scale increases) when deltaY < 0', () => {
      const { newScale } = calcWheelZoom(-1, 1, 0, 0, 0, 0);
      expect(newScale).toBeCloseTo(SCALE_BY);
    });

    it('zooms out (scale decreases) when deltaY > 0', () => {
      const { newScale } = calcWheelZoom(1, 1, 0, 0, 0, 0);
      expect(newScale).toBeCloseTo(1 / SCALE_BY);
    });

    it('each zoom step multiplies/divides by the fixed SCALE_BY factor (1.25)', () => {
      const { newScale: zoomedIn } = calcWheelZoom(-1, 2, 0, 0, 0, 0);
      expect(zoomedIn).toBeCloseTo(2 * SCALE_BY);

      const { newScale: zoomedOut } = calcWheelZoom(1, 2, 0, 0, 0, 0);
      expect(zoomedOut).toBeCloseTo(2 / SCALE_BY);
    });
  });

  describe('scale clamping', () => {
    it('does not exceed MAX_SCALE when zooming in at the limit', () => {
      const { newScale } = calcWheelZoom(-1, MAX_SCALE, 0, 0, 0, 0);
      expect(newScale).toBe(MAX_SCALE);
    });

    it('does not go below MIN_SCALE when zooming out at the limit', () => {
      const { newScale } = calcWheelZoom(1, MIN_SCALE, 0, 0, 0, 0);
      expect(newScale).toBe(MIN_SCALE);
    });
  });

  describe('pointer-centred zoom invariant', () => {
    it('keeps the world point under the pointer stable after zoom', () => {
      const pointerX = 400;
      const pointerY = 300;
      const stageX = 0;
      const stageY = 0;
      const oldScale = 1;

      const { newScale, newPosition } = calcWheelZoom(
        -1,
        oldScale,
        pointerX,
        pointerY,
        stageX,
        stageY
      );

      const worldXBefore = (pointerX - stageX) / oldScale;
      const worldYBefore = (pointerY - stageY) / oldScale;
      const worldXAfter = (pointerX - newPosition.x) / newScale;
      const worldYAfter = (pointerY - newPosition.y) / newScale;

      expect(worldXAfter).toBeCloseTo(worldXBefore);
      expect(worldYAfter).toBeCloseTo(worldYBefore);
    });

    it('invariant holds when the stage is already panned', () => {
      const { newScale, newPosition } = calcWheelZoom(-1, 1, 400, 300, -200, -150);

      const worldXBefore = (400 - -200) / 1;
      const worldXAfter = (400 - newPosition.x) / newScale;

      expect(worldXAfter).toBeCloseTo(worldXBefore);
    });

    it('invariant holds across a range of existing scale values', () => {
      for (const oldScale of [0.5, 1, 2, 5, 10]) {
        const { newScale, newPosition } = calcWheelZoom(
          -1,
          oldScale,
          400,
          300,
          100,
          100
        );
        const worldXBefore = (400 - 100) / oldScale;
        const worldXAfter = (400 - newPosition.x) / newScale;
        expect(worldXAfter).toBeCloseTo(worldXBefore, 8);
      }
    });

    it('zoom-out invariant holds (deltaY > 0)', () => {
      const { newScale, newPosition } = calcWheelZoom(1, 2, 500, 400, 50, 50);

      const worldXBefore = (500 - 50) / 2;
      const worldXAfter = (500 - newPosition.x) / newScale;

      expect(worldXAfter).toBeCloseTo(worldXBefore);
    });
  });

  describe('position update', () => {
    it('position stays at pointer when stage origin equals pointer', () => {
      // If stage is at (400, 300) and pointer is at (400, 300), world point = (0, 0)
      // After zoom, new position should keep (0, 0) under (400, 300)
      const { newPosition } = calcWheelZoom(-1, 1, 400, 300, 400, 300);
      expect(newPosition.x).toBeCloseTo(400);
      expect(newPosition.y).toBeCloseTo(300);
    });
  });
});
