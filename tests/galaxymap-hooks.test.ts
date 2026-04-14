import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const HOOKS_DIR = path.resolve(__dirname, '../src/components/hooks');
const GALAXYMAP_PATH = path.resolve(
  __dirname,
  '../src/components/pages/GalaxyMap.tsx'
);

describe('GalaxyMap hook extraction', () => {
  describe('canvasUtils', () => {
    const filePath = path.join(HOOKS_DIR, 'canvasUtils.ts');

    it('exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('exports getDistance', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('export function getDistance');
    });

    it('exports requestBatchDraw', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('export function requestBatchDraw');
    });
  });

  describe('usePreventBrowserZoom', () => {
    const filePath = path.join(HOOKS_DIR, 'usePreventBrowserZoom.ts');

    it('exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('exports default hook', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('export default usePreventBrowserZoom');
    });

    it('returns stageSize', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('stageSize');
    });

    it('handles gesture prevention', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('gesturestart');
      expect(content).toContain('touchmove');
    });
  });

  describe('useZoomPan', () => {
    const filePath = path.join(HOOKS_DIR, 'useZoomPan.ts');

    it('exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('exports default hook', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('export default useZoomPan');
    });

    it('returns handleWheel and handleDragMove', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toMatch(/return\s*\{[\s\S]*handleWheel[\s\S]*\}/);
      expect(content).toMatch(/return\s*\{[\s\S]*handleDragMove[\s\S]*\}/);
    });

    it('uses shared requestBatchDraw', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain("from './canvasUtils'");
    });
  });

  describe('usePinchZoom', () => {
    const filePath = path.join(HOOKS_DIR, 'usePinchZoom.ts');

    it('exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('exports default hook', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('export default usePinchZoom');
    });

    it('returns touch handlers and isPinching', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('handleTouchStart');
      expect(content).toContain('handleTouchMove');
      expect(content).toContain('handleTouchEnd');
      expect(content).toContain('isPinching');
    });

    it('uses shared getDistance and requestBatchDraw', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain("from './canvasUtils'");
      expect(content).toContain('getDistance');
      expect(content).toContain('requestBatchDraw');
    });
  });

  describe('GalaxyMap.tsx integration', () => {
    const content = fs.readFileSync(GALAXYMAP_PATH, 'utf-8');

    it('imports usePreventBrowserZoom', () => {
      expect(content).toContain('usePreventBrowserZoom');
    });

    it('imports useZoomPan', () => {
      expect(content).toContain('useZoomPan');
    });

    it('imports usePinchZoom', () => {
      expect(content).toContain('usePinchZoom');
    });

    it('no longer contains inline gesture prevention effects', () => {
      // The extracted effects used document.addEventListener('touchmove', ...)
      // and window.addEventListener('gesturestart', ...) directly.
      // GalaxyMap should no longer have these — they live in the hooks.
      expect(content).not.toContain("document.addEventListener('touchmove'");
      expect(content).not.toContain("window.addEventListener('gesturestart'");
    });

    it('is under 300 lines', () => {
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThan(300);
    });
  });
});
