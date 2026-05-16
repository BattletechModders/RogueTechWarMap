import { describe, it, expect } from 'vitest';

// Core coordinate math from useTooltip.showTooltip.
// When stageX/Y are provided the pointer is in screen space and must be
// converted to stage-local space; without them the pointer is already local.
const calcTooltipPosition = (
  pointerX: number,
  pointerY: number,
  scale: number,
  stageX?: number,
  stageY?: number
) => ({
  x: stageX !== undefined ? (pointerX - stageX) / scale : pointerX,
  y: stageY !== undefined ? (pointerY - stageY) / scale : pointerY,
});

describe('useTooltip coordinate math', () => {
  it('uses raw pointer coords when stage offsets are not provided', () => {
    const pos = calcTooltipPosition(200, 150, 2);
    expect(pos).toEqual({ x: 200, y: 150 });
  });

  it('converts screen pointer to stage-local coords when stage offsets are given', () => {
    // Stage at (100, 50), scale 2, pointer at (300, 250):
    // x = (300 - 100) / 2 = 100, y = (250 - 50) / 2 = 100
    const pos = calcTooltipPosition(300, 250, 2, 100, 50);
    expect(pos).toEqual({ x: 100, y: 100 });
  });

  it('divides by scale correctly when zoomed in (scale > 1)', () => {
    const pos = calcTooltipPosition(500, 400, 4, 100, 100);
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(75);
  });

  it('divides by scale correctly when zoomed out (scale < 1)', () => {
    const pos = calcTooltipPosition(200, 150, 0.5, 0, 0);
    expect(pos.x).toBeCloseTo(400);
    expect(pos.y).toBeCloseTo(300);
  });

  it('returns (0, 0) when pointer is exactly at the stage origin', () => {
    const pos = calcTooltipPosition(100, 80, 3, 100, 80);
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0);
  });

  it('handles negative stage offsets (stage panned right/down past origin)', () => {
    // Stage offset −200 means the stage has been dragged right by 200px
    const pos = calcTooltipPosition(300, 200, 1, -200, -100);
    expect(pos.x).toBeCloseTo(500);
    expect(pos.y).toBeCloseTo(300);
  });

  it('scale=1 leaves coords unchanged relative to stage origin', () => {
    const pos = calcTooltipPosition(400, 300, 1, 0, 0);
    expect(pos.x).toBe(400);
    expect(pos.y).toBe(300);
  });
});
