import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const content = fs.readFileSync(
  path.resolve(__dirname, '../../src/components/hooks/useFiltering.ts'),
  'utf-8'
);

describe('useFiltering', () => {
  describe('data projection', () => {
    it('defines projectSystemData with useCallback', () => {
      expect(content).toContain('const projectSystemData = useCallback');
    });

    it('calls findFaction for each system owner', () => {
      expect(content).toContain('findFaction(value.owner, factions)');
    });

    it('sets factionName with fallback to Unknown Faction', () => {
      expect(content).toContain("'Unknown Faction'");
    });

    it('sets factionColour with fallback to gray', () => {
      expect(content).toContain("'gray'");
    });

    it('checks isCapital for each system', () => {
      expect(content).toContain('isCapital(value.name, capitals)');
    });

    it('spreads original system values into projected system', () => {
      expect(content).toContain('...value');
    });

    it('memoizes on capitals and factions', () => {
      expect(content).toContain('[capitals, factions]');
    });
  });

  describe('effect triggers', () => {
    it('runs projection when rawSystems changes', () => {
      expect(content).toContain('projectSystemData(rawSystems)');
    });

    it('depends on rawSystems, capitals, factions, projectSystemData', () => {
      expect(content).toContain(
        '[rawSystems, capitals, factions, projectSystemData]'
      );
    });
  });

  describe('delegated state', () => {
    it('uses useWarmapAPI for data fetching', () => {
      expect(content).toContain('useWarmapAPI()');
    });

    it('uses useSettings for settings', () => {
      expect(content).toContain('useSettings()');
    });
  });

  describe('return value', () => {
    it('returns displaySystems', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*displaySystems[\s\S]*\}/);
    });

    it('returns factions and capitals', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*\bfactions\b[\s\S]*\}/);
      expect(content).toMatch(/return\s*\{[\s\S]*capitals[\s\S]*\}/);
    });

    it('returns fetch functions', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*fetchFactionData[\s\S]*\}/);
      expect(content).toMatch(/return\s*\{[\s\S]*fetchSystemData[\s\S]*\}/);
    });

    it('returns settings', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*settings[\s\S]*\}/);
    });
  });
});
