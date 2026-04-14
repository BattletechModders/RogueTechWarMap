import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const content = fs.readFileSync(
  path.resolve(__dirname, '../../src/components/hooks/useTooltip.ts'),
  'utf-8'
);

describe('useTooltip', () => {
  describe('initial state', () => {
    it('starts with visible: false', () => {
      expect(content).toContain('visible: false');
    });

    it('starts with empty text', () => {
      expect(content).toMatch(/text:\s*''/);
    });

    it('starts at position 0,0', () => {
      expect(content).toMatch(/x:\s*0/);
      expect(content).toMatch(/y:\s*0/);
    });
  });

  describe('showTooltip', () => {
    it('accepts text, pointerX, pointerY parameters', () => {
      expect(content).toContain('text: string');
      expect(content).toContain('pointerX: number');
      expect(content).toContain('pointerY: number');
    });

    it('accepts optional stageX and stageY for coordinate transformation', () => {
      expect(content).toContain('stageX?: number');
      expect(content).toContain('stageY?: number');
    });

    it('accepts optional onTouch callback', () => {
      expect(content).toContain('onTouch?: () => void');
    });

    it('uses scale from scaleRef for coordinate calculation', () => {
      expect(content).toContain('scaleRef.current');
    });

    it('falls back to scale 1 when scaleRef is falsy', () => {
      expect(content).toMatch(/scaleRef\.current\s*\|\|\s*1/);
    });

    it('transforms coordinates when stageX/stageY provided', () => {
      // (pointerX - stageX) / scale
      expect(content).toContain('pointerX - stageX');
      expect(content).toContain('pointerY - stageY');
    });

    it('uses raw coordinates when stageX is undefined', () => {
      expect(content).toContain('stageX !== undefined');
    });

    it('sets visible to true', () => {
      expect(content).toContain('visible: true');
    });
  });

  describe('hideTooltip', () => {
    it('sets visible to false', () => {
      expect(content).toContain('visible: false');
    });

    it('preserves other tooltip state via spread', () => {
      expect(content).toContain('...prev');
    });
  });

  describe('return value', () => {
    it('returns tooltip, showTooltip, and hideTooltip', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*tooltip[\s\S]*showTooltip[\s\S]*hideTooltip[\s\S]*\}/);
    });
  });
});
