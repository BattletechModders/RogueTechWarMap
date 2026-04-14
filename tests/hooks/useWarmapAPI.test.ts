import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const content = fs.readFileSync(
  path.resolve(__dirname, '../../src/components/hooks/useWarmapAPI.ts'),
  'utf-8'
);

describe('useWarmapAPI', () => {
  describe('initial state', () => {
    it('initializes rawSystems as empty array', () => {
      expect(content).toContain('useState<StarSystemType[]>([])');
    });

    it('initializes factions as empty object', () => {
      expect(content).toContain('useState<FactionDataType>({})');
    });

    it('initializes capitals as empty array', () => {
      expect(content).toContain("useState<string[]>([])");
    });
  });

  describe('fetchFactionData', () => {
    it('fetches from the correct factions endpoint', () => {
      expect(content).toContain('`${API_BASE_URL}/api/v1/factions/warmap`');
    });

    it('adds NoFaction with gray colour and Unaffiliated prettyName', () => {
      expect(content).toContain("factionData['NoFaction']");
      expect(content).toContain("colour: 'gray'");
      expect(content).toContain("prettyName: 'Unaffiliated'");
    });

    it('extracts capitals from faction data', () => {
      expect(content).toContain('capitals.push(factionData[key].capital)');
    });

    it('only pushes capitals when they exist (truthy check)', () => {
      expect(content).toContain('if (factionData[key].capital)');
    });

    it('has error handling in catch block', () => {
      const catchCount = (content.match(/\bcatch\b/g) || []).length;
      expect(catchCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('fetchSystemData', () => {
    it('fetches from the correct starmap endpoint', () => {
      expect(content).toContain('`${API_BASE_URL}/api/v1/starmap/warmap`');
    });

    it('sets rawSystems from response', () => {
      expect(content).toContain('setRawSystems(systemData)');
    });
  });

  describe('return value', () => {
    it('returns rawSystems', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*rawSystems[\s\S]*\}/);
    });

    it('returns factions', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*\bfactions\b[\s\S]*\}/);
    });

    it('returns capitals', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*capitals[\s\S]*\}/);
    });

    it('returns fetchFactionData and fetchSystemData', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*fetchFactionData[\s\S]*\}/);
      expect(content).toMatch(/return\s*\{[\s\S]*fetchSystemData[\s\S]*\}/);
    });
  });
});
