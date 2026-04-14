import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const content = fs.readFileSync(
  path.resolve(__dirname, '../../src/components/pages/GalaxyMap.tsx'),
  'utf-8'
);

describe('GalaxyMap component logic', () => {
  describe('data loading', () => {
    it('uses useFiltering hook for data', () => {
      expect(content).toContain('useFiltering()');
    });

    it('tracks initialDataLoaded to prevent double-fetch', () => {
      expect(content).toContain('initialDataLoaded');
      expect(content).toContain('setInitialDataLoaded(true)');
    });

    it('fetches faction and system data on mount', () => {
      expect(content).toContain('fetchFactionData()');
      expect(content).toContain('fetchSystemData()');
    });

    it('sets up 5-minute refresh interval (300_000ms)', () => {
      expect(content).toContain('300_000');
      expect(content).toContain('setInterval');
    });

    it('cleans up interval on unmount', () => {
      expect(content).toContain('clearInterval(interval)');
    });
  });

  describe('render guards', () => {
    it('checks displaySystems has data before rendering', () => {
      expect(content).toContain('displaySystems.length > 0');
    });

    it('checks factions exist before rendering', () => {
      expect(content).toMatch(/factions\s*&&/);
    });

    it('checks capitals exist before rendering', () => {
      expect(content).toContain('capitals.length > 0');
    });
  });

  describe('search filtering', () => {
    it('normalizes search to lowercase', () => {
      expect(content).toContain('.trim().toLowerCase()');
    });

    it('requires minimum 2 characters to filter', () => {
      expect(content).toContain('>= 2');
    });

    it('applies opacity 0.2 for non-matching systems', () => {
      expect(content).toContain('0.2');
    });

    it('applies opacity 1 for matching systems', () => {
      expect(content).toMatch(/isMatch\s*\?\s*1\s*:/);
    });
  });

  describe('faction filtering', () => {
    it('supports selectedFactions state', () => {
      expect(content).toContain('selectedFactions');
    });

    it('resolves owner pretty name for comparison', () => {
      expect(content).toContain("factions[system.owner]?.prettyName");
    });

    it('returns null for non-matching factions', () => {
      expect(content).toContain('if (!factionMatch) return null');
    });
  });

  describe('canvas configuration', () => {
    it('defines MIN_SCALE and MAX_SCALE', () => {
      expect(content).toContain('MIN_SCALE');
      expect(content).toContain('MAX_SCALE');
    });

    it('uses Konva Stage component', () => {
      expect(content).toContain('<Stage');
    });

    it('renders background image layer', () => {
      expect(content).toContain('galaxyBackground2');
    });

    it('detects Firefox for webp fallback', () => {
      expect(content).toContain('firefox');
      expect(content).toContain('.webp');
      expect(content).toContain('.svg');
    });
  });

  describe('tooltip', () => {
    it('uses useTooltip hook', () => {
      expect(content).toContain('useTooltip');
    });

    it('scales tooltip differently for mobile vs desktop', () => {
      expect(content).toMatch(/isMobile.*1\.5/);
    });

    it('renders tooltip Label when visible', () => {
      expect(content).toContain('tooltip.visible');
    });
  });

  describe('exports', () => {
    it('exports GalaxyMap as default', () => {
      expect(content).toContain('export default GalaxyMap');
    });

    it('exports Map as named export', () => {
      expect(content).toContain('export const Map = GalaxyMap');
    });
  });
});
