import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const content = fs.readFileSync(
  path.resolve(__dirname, '../../src/components/hooks/usePinchZoom.ts'),
  'utf-8'
);

describe('usePinchZoom', () => {
  describe('scale constants', () => {
    it('defines MIN_SCALE as 0.2', () => {
      expect(content).toContain('MIN_SCALE = 0.2');
    });

    it('defines MAX_SCALE as 25', () => {
      expect(content).toContain('MAX_SCALE = 25');
    });
  });

  describe('handleTouchStart', () => {
    it('handles single touch — hides tooltip when not on Circle or Label', () => {
      expect(content).toContain("e.evt.touches.length === 1");
      expect(content).toContain("e.target.className === 'Circle'");
      expect(content).toContain("findAncestor('Label', true)");
      expect(content).toContain('hideTooltip()');
    });

    it('handles two-finger touch — sets isPinching true', () => {
      expect(content).toContain('e.evt.touches.length === 2');
      expect(content).toContain('setIsPinching(true)');
    });

    it('calculates initial distance between touches', () => {
      expect(content).toContain('getDistance(e.evt.touches[0], e.evt.touches[1])');
    });

    it('calculates pinch midpoint', () => {
      expect(content).toContain('pinchMidpoint.current');
      expect(content).toContain('e.evt.touches[0].clientX + e.evt.touches[1].clientX');
    });
  });

  describe('handleTouchMove', () => {
    it('prevents default on two-finger move', () => {
      expect(content).toContain('e.evt.preventDefault()');
    });

    it('has jitter prevention with 0.02 dead zone', () => {
      expect(content).toContain('Math.abs(1 - scaleBy) < 0.02');
    });

    it('clamps scaleBy between 0.9 and 1.1', () => {
      expect(content).toContain('Math.max(0.9, Math.min(1.1, scaleBy))');
    });

    it('clamps final scale between MIN and MAX', () => {
      expect(content).toContain('Math.max(');
      expect(content).toContain('MIN_SCALE');
      expect(content).toContain('MAX_SCALE');
    });

    it('calculates world position from pinch center', () => {
      expect(content).toContain('pinchCenter');
      expect(content).toContain('worldPos');
    });

    it('uses requestAnimationFrame for smooth updates', () => {
      expect(content).toContain('requestAnimationFrame');
    });

    it('calls onScaleChange callback', () => {
      expect(content).toContain('onScaleChange');
    });

    it('uses shared getDistance and requestBatchDraw', () => {
      expect(content).toContain("from './canvasUtils'");
      expect(content).toContain('getDistance');
      expect(content).toContain('requestBatchDraw');
    });
  });

  describe('handleTouchEnd', () => {
    it('sets isPinching false when fewer than 2 touches remain', () => {
      expect(content).toContain('e.evt.touches.length < 2');
      expect(content).toContain('setIsPinching(false)');
    });
  });

  describe('return value', () => {
    it('returns isPinching state and all touch handlers', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*isPinching[\s\S]*\}/);
      expect(content).toMatch(/return\s*\{[\s\S]*handleTouchStart[\s\S]*\}/);
      expect(content).toMatch(/return\s*\{[\s\S]*handleTouchMove[\s\S]*\}/);
      expect(content).toMatch(/return\s*\{[\s\S]*handleTouchEnd[\s\S]*\}/);
    });
  });
});
