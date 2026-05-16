import { describe, it, expect, vi, afterEach } from 'vitest';
import { applyDevStateInjection } from '../src/components/helpers/devStateInjector';
import type { StarSystemType } from '../src/components/hooks/types';

const makeSystem = (name: string, state?: StarSystemType['state']): StarSystemType => ({
  name,
  posX: 0,
  posY: 0,
  owner: 'FACTION_A',
  factions: [],
  sysUrl: `/system/${name}`,
  state,
});

const mockWindow = (
  search = '',
  localStorageItems: Record<string, string> = {}
) => ({
  location: { search },
  localStorage: {
    getItem: (key: string) => localStorageItems[key] ?? null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('applyDevStateInjection', () => {
  it('returns the same array reference when window is not defined', () => {
    const systems = [makeSystem('Alpha')];
    // In Node (vitest default env), window is naturally undefined — no stub needed
    expect(applyDevStateInjection(systems)).toBe(systems);
  });

  it('returns the same array reference when no enabled flag is set', () => {
    vi.stubGlobal('window', mockWindow('', {}));
    const systems = [makeSystem('Alpha')];
    expect(applyDevStateInjection(systems)).toBe(systems);
  });

  describe('isTruthyFlag — URL param falsy values disable injection', () => {
    it('stateTest=false → disabled', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=false', {}));
      const systems = [makeSystem('Alpha')];
      expect(applyDevStateInjection(systems)).toBe(systems);
    });

    it('stateTest=0 → disabled', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=0', {}));
      const systems = [makeSystem('Alpha')];
      expect(applyDevStateInjection(systems)).toBe(systems);
    });

    it('stateTest=off → disabled', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=off', {}));
      const systems = [makeSystem('Alpha')];
      expect(applyDevStateInjection(systems)).toBe(systems);
    });
  });

  describe('isTruthyFlag — URL param truthy values enable injection', () => {
    const fiveSystems = () => ['Alpha', 'Beta', 'Charlie', 'Delta', 'Echo'].map(makeSystem);

    it('stateTest=true → enabled', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {}));
      const result = applyDevStateInjection(fiveSystems());
      expect(result.some((s) => s.state !== undefined)).toBe(true);
    });

    it('stateTest=1 → enabled', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=1', {}));
      const result = applyDevStateInjection(fiveSystems());
      expect(result.some((s) => s.state !== undefined)).toBe(true);
    });

    it('URL param key matching is case-insensitive (STATETEST=true)', () => {
      vi.stubGlobal('window', mockWindow('?STATETEST=true', {}));
      const result = applyDevStateInjection(fiveSystems());
      expect(result.some((s) => s.state !== undefined)).toBe(true);
    });
  });

  it('enables injection via localStorage when URL param is absent', () => {
    vi.stubGlobal('window', mockWindow('', { warMapDevStateTest: 'true' }));
    const systems = ['Alpha', 'Beta', 'Charlie', 'Delta', 'Echo'].map(makeSystem);
    const result = applyDevStateInjection(systems);
    expect(result.some((s) => s.state !== undefined)).toBe(true);
  });

  describe('sample preset (default)', () => {
    it('assigns distinct state types to the first 5 systems in alphabetical order', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {}));
      const systems = ['Alpha', 'Beta', 'Charlie', 'Delta', 'Echo'].map(makeSystem);
      const result = applyDevStateInjection(systems);
      const byName = Object.fromEntries(result.map((s) => [s.name, s.state]));

      // buildSampleOverrides: [0]=isInsurrect, [1]=hasPirateRaid, [2]=hasCaptureEvent,
      //                        [3]=hasHoldTheLineEvent, [4]=hasPirateRaid+hasCaptureEvent
      expect(byName['Alpha']?.isInsurrect).toBe(true);
      expect(byName['Beta']?.hasPirateRaid).toBe(true);
      expect(byName['Charlie']?.hasCaptureEvent).toBe(true);
      expect(byName['Delta']?.hasHoldTheLineEvent).toBe(true);
      expect(byName['Echo']?.hasPirateRaid).toBe(true);
      expect(byName['Echo']?.hasCaptureEvent).toBe(true);
    });

    it('leaves systems beyond the first 5 as the same object reference (not mutated)', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {}));
      const foxtrot = makeSystem('Foxtrot');
      // Foxtrot is 6th alphabetically — excluded from sample preset's first 5
      const systems = [makeSystem('Alpha'), makeSystem('Beta'), makeSystem('Charlie'), makeSystem('Delta'), makeSystem('Echo'), foxtrot];
      const result = applyDevStateInjection(systems);
      const resultFoxtrot = result.find((s) => s.name === 'Foxtrot');
      // Same reference means no override was applied
      expect(resultFoxtrot).toBe(foxtrot);
    });
  });

  describe('dense preset', () => {
    const SYSTEMS = Array.from({ length: 13 }, (_, i) =>
      makeSystem(`System${String(i).padStart(2, '0')}`)
    );

    it('cycles through 4 state types across the first 12 systems', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true&statePreset=dense', {}));
      const result = applyDevStateInjection(SYSTEMS);
      const byName = Object.fromEntries(result.map((s) => [s.name, s.state]));

      // idx % 4: 0→isInsurrect, 1→hasPirateRaid, 2→hasCaptureEvent, 3→hasHoldTheLineEvent
      expect(byName['System00']?.isInsurrect).toBe(true);
      expect(byName['System01']?.hasPirateRaid).toBe(true);
      expect(byName['System02']?.hasCaptureEvent).toBe(true);
      expect(byName['System03']?.hasHoldTheLineEvent).toBe(true);
      expect(byName['System04']?.isInsurrect).toBe(true);
      expect(byName['System08']?.isInsurrect).toBe(true);
    });

    it('leaves the 13th system (index 12, beyond first 12) without dense preset state', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true&statePreset=dense', {}));
      const result = applyDevStateInjection(SYSTEMS);
      const last = result.find((s) => s.name === 'System12');
      expect(last?.state).toBeUndefined();
    });
  });

  describe('named system overrides', () => {
    it('applies isInsurrect to known insurrection systems', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {}));
      const systems = [makeSystem('Tainjin'), makeSystem('Millerton')];
      const result = applyDevStateInjection(systems);
      const byName = Object.fromEntries(result.map((s) => [s.name, s.state]));
      expect(byName['Tainjin']?.isInsurrect).toBe(true);
      expect(byName['Millerton']?.isInsurrect).toBe(true);
    });

    it('applies hasPirateRaid to known pirate raid systems', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {}));
      const systems = [makeSystem('Bougie'), makeSystem('Naco')];
      const result = applyDevStateInjection(systems);
      const byName = Object.fromEntries(result.map((s) => [s.name, s.state]));
      expect(byName['Bougie']?.hasPirateRaid).toBe(true);
      expect(byName['Naco']?.hasPirateRaid).toBe(true);
    });

    it('applies hasHoldTheLineEvent to the known hold-the-line system', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {}));
      const systems = [makeSystem('Port Vail (The Rack 3050+)')];
      const result = applyDevStateInjection(systems);
      expect(result[0].state?.hasHoldTheLineEvent).toBe(true);
    });

    it('applies hasCaptureEvent to the known capture event system', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {}));
      const systems = [makeSystem('Wiltshire')];
      const result = applyDevStateInjection(systems);
      expect(result[0].state?.hasCaptureEvent).toBe(true);
    });

    it('matches system names case-insensitively', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {}));
      // DEV_INSURRECTION_SYSTEMS has 'Tainjin'; provide it lowercased
      const systems = [makeSystem('tainjin')];
      const result = applyDevStateInjection(systems);
      expect(result[0].state?.isInsurrect).toBe(true);
    });
  });

  describe('custom localStorage overrides', () => {
    it('applies custom overrides and they take priority over preset', () => {
      const customOverrides = JSON.stringify({ Alpha: { hasPirateRaid: true } });
      vi.stubGlobal('window', mockWindow('?stateTest=true', {
        warMapDevStateOverrides: customOverrides,
      }));
      const systems = ['Alpha', 'Beta', 'Charlie', 'Delta', 'Echo'].map(makeSystem);
      const result = applyDevStateInjection(systems);
      const alpha = result.find((s) => s.name === 'Alpha');
      expect(alpha?.state?.hasPirateRaid).toBe(true);
    });

    it('invalid JSON in localStorage is silently ignored without throwing', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {
        warMapDevStateOverrides: '{{{not-valid-json',
      }));
      const systems = ['Alpha', 'Beta', 'Charlie', 'Delta', 'Echo'].map(makeSystem);
      expect(() => applyDevStateInjection(systems)).not.toThrow();
    });

    it('rejects override entries with non-boolean state values (isStateOverrideMap guard)', () => {
      const badOverrides = JSON.stringify({ Alpha: { isInsurrect: 'yes' } });
      vi.stubGlobal('window', mockWindow('?stateTest=true', {
        warMapDevStateOverrides: badOverrides,
      }));
      const systems = [makeSystem('Alpha')];
      expect(() => applyDevStateInjection(systems)).not.toThrow();
    });

    it('rejects override entries that are not objects', () => {
      const badOverrides = JSON.stringify({ Alpha: 'insurrect' });
      vi.stubGlobal('window', mockWindow('?stateTest=true', {
        warMapDevStateOverrides: badOverrides,
      }));
      const systems = [makeSystem('Alpha')];
      expect(() => applyDevStateInjection(systems)).not.toThrow();
    });
  });

  describe('state merging', () => {
    it('merges injected state onto existing state without dropping prior keys', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {}));
      // Alpha starts with hasPirateRaid; sample preset injects isInsurrect onto it
      const systems = [
        makeSystem('Alpha', { hasPirateRaid: true }),
        makeSystem('Beta'),
        makeSystem('Charlie'),
        makeSystem('Delta'),
        makeSystem('Echo'),
      ];
      const result = applyDevStateInjection(systems);
      const alpha = result.find((s) => s.name === 'Alpha')!;
      // { ...system.state, ...injected } → both keys survive
      expect(alpha.state?.isInsurrect).toBe(true);
      expect(alpha.state?.hasPirateRaid).toBe(true);
    });

    it('returns the same object reference for unmatched systems', () => {
      vi.stubGlobal('window', mockWindow('?stateTest=true', {}));
      const unmatched = makeSystem('ZzNoOverrideMatch');
      // Put unmatched 6th so sample preset's first 5 are the others
      const systems = [
        makeSystem('Alpha'),
        makeSystem('Beta'),
        makeSystem('Charlie'),
        makeSystem('Delta'),
        makeSystem('Echo'),
        unmatched,
      ];
      const result = applyDevStateInjection(systems);
      const resultUnmatched = result.find((s) => s.name === 'ZzNoOverrideMatch')!;
      expect(resultUnmatched).toBe(unmatched);
    });
  });
});
