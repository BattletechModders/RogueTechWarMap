import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const content = fs.readFileSync(
  path.resolve(__dirname, '../../src/components/hooks/useZoomPan.ts'),
  'utf-8'
);

describe('useZoomPan', () => {
  describe('scale constants', () => {
    it('defines MIN_SCALE as 0.2', () => {
      expect(content).toContain('MIN_SCALE = 0.2');
    });

    it('defines MAX_SCALE as 25', () => {
      expect(content).toContain('MAX_SCALE = 25');
    });

    it('defines WHEEL_THROTTLE_MS as 50', () => {
      expect(content).toContain('WHEEL_THROTTLE_MS = 50');
    });
  });

  describe('handleWheel', () => {
    it('calls evt.preventDefault', () => {
      expect(content).toContain('e.evt.preventDefault()');
    });

    it('uses 1.25 as the scale factor', () => {
      expect(content).toContain('scaleBy = 1.25');
    });

    it('throttles based on performance.now()', () => {
      expect(content).toContain('performance.now()');
      expect(content).toContain('WHEEL_THROTTLE_MS');
    });

    it('clamps scale between MIN and MAX', () => {
      expect(content).toContain('Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))');
    });

    it('zooms toward pointer position', () => {
      expect(content).toContain('mousePointTo');
      expect(content).toContain('stage.getPointerPosition()');
    });

    it('updates scaleRef and positionRef', () => {
      expect(content).toContain('scaleRef.current = newScale');
      expect(content).toContain('positionRef.current');
    });

    it('calls onScaleChange callback', () => {
      expect(content).toContain('onScaleChange');
    });

    it('uses requestBatchDraw from canvasUtils', () => {
      expect(content).toContain("from './canvasUtils'");
      expect(content).toContain('requestBatchDraw(stage)');
    });
  });

  describe('handleDragMove', () => {
    it('updates positionRef from event target', () => {
      expect(content).toContain('e.target.x()');
      expect(content).toContain('e.target.y()');
    });
  });

  describe('return value', () => {
    it('returns handleWheel and handleDragMove', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*handleWheel[\s\S]*handleDragMove[\s\S]*\}/);
    });
  });
});
