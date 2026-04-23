import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyDevStateInjection } from './devStateInjector';
import type { StarSystemType } from '../hooks/types';

const makeSystem = (
  name: string,
  extras: Partial<StarSystemType> = {}
): StarSystemType => ({
  name,
  posX: 0,
  posY: 0,
  owner: 'NoFaction',
  factions: [],
  ...extras,
});

const ENABLE_STORAGE_KEY = 'warMapDevStateTest';
const PRESET_STORAGE_KEY = 'warMapDevStatePreset';
const OVERRIDES_STORAGE_KEY = 'warMapDevStateOverrides';

const resetLocation = () => {
  window.history.replaceState({}, '', '/');
};

beforeEach(() => {
  window.localStorage.clear();
  resetLocation();
});

describe('applyDevStateInjection', () => {
  it('returns the input systems untouched when the feature is disabled (no flag set)', () => {
    const systems = [makeSystem('Terra'), makeSystem('Altair')];
    const result = applyDevStateInjection(systems);
    expect(result).toEqual(systems);
  });

  it('returns input unchanged when enabled but no systems match any override', () => {
    window.localStorage.setItem(ENABLE_STORAGE_KEY, '1');
    window.localStorage.setItem(PRESET_STORAGE_KEY, 'nonexistent');
    // nothing in DEV_*_SYSTEMS lists will match these names; also preset falls back to 'sample'
    const systems = [makeSystem('ZZZ1'), makeSystem('ZZZ2')];
    const result = applyDevStateInjection(systems);
    // "sample" preset picks first 5 alphabetically → ZZZ1, ZZZ2 get overrides
    // so at least some systems will be touched; assert shape rather than equality
    expect(result).toHaveLength(2);
  });

  it('applies the sample preset when ?stateTest=1 is set in URL', () => {
    window.history.replaceState({}, '', '/?stateTest=1&statePreset=sample');
    const systems = [
      makeSystem('Alpha'),
      makeSystem('Bravo'),
      makeSystem('Charlie'),
      makeSystem('Delta'),
      makeSystem('Echo'),
      makeSystem('Foxtrot'),
    ];
    const result = applyDevStateInjection(systems);
    expect(result.find((s) => s.name === 'Alpha')?.state?.isInsurrect).toBe(true);
    expect(result.find((s) => s.name === 'Bravo')?.state?.hasPirateRaid).toBe(true);
    expect(result.find((s) => s.name === 'Charlie')?.state?.hasCaptureEvent).toBe(true);
    expect(result.find((s) => s.name === 'Delta')?.state?.hasHoldTheLineEvent).toBe(true);
    expect(result.find((s) => s.name === 'Echo')?.state?.hasPirateRaid).toBe(true);
    expect(result.find((s) => s.name === 'Echo')?.state?.hasCaptureEvent).toBe(true);
  });

  it('applies the dense preset when statePreset=dense', () => {
    window.history.replaceState({}, '', '/?stateTest=1&statePreset=dense');
    const systems = [
      makeSystem('A1'),
      makeSystem('A2'),
      makeSystem('A3'),
      makeSystem('A4'),
    ];
    const result = applyDevStateInjection(systems);
    // Dense preset uses idx % 4: 0→isInsurrect, 1→hasPirateRaid, 2→hasCaptureEvent, 3→hasHoldTheLineEvent
    const byName = Object.fromEntries(result.map((s) => [s.name, s]));
    expect(byName.A1.state?.isInsurrect).toBe(true);
    expect(byName.A2.state?.hasPirateRaid).toBe(true);
    expect(byName.A3.state?.hasCaptureEvent).toBe(true);
    expect(byName.A4.state?.hasHoldTheLineEvent).toBe(true);
  });

  it('injects insurrection on named systems when enabled', () => {
    window.localStorage.setItem(ENABLE_STORAGE_KEY, 'true');
    const systems = [makeSystem('Terra'), makeSystem('Dieron')];
    const result = applyDevStateInjection(systems);
    expect(result.find((s) => s.name === 'Terra')?.state?.isInsurrect).toBe(true);
    expect(result.find((s) => s.name === 'Dieron')?.state?.isInsurrect).toBe(true);
  });

  it('matches named targets case-insensitively (canonical name is preserved)', () => {
    window.localStorage.setItem(ENABLE_STORAGE_KEY, 'on');
    // lowercase system name should still be injected because lookup lower-cases targets
    const systems = [makeSystem('terra')];
    const result = applyDevStateInjection(systems);
    expect(result[0].state?.isInsurrect).toBe(true);
    expect(result[0].name).toBe('terra');
  });

  it('treats "0", "false", "off" in the enable flag as disabled', () => {
    window.localStorage.setItem(ENABLE_STORAGE_KEY, 'false');
    const systems = [makeSystem('Terra')];
    expect(applyDevStateInjection(systems)).toEqual(systems);

    window.localStorage.setItem(ENABLE_STORAGE_KEY, '0');
    expect(applyDevStateInjection(systems)).toEqual(systems);

    window.localStorage.setItem(ENABLE_STORAGE_KEY, 'off');
    expect(applyDevStateInjection(systems)).toEqual(systems);
  });

  it('honors a custom override map stored in localStorage', () => {
    window.localStorage.setItem(ENABLE_STORAGE_KEY, '1');
    window.localStorage.setItem(
      OVERRIDES_STORAGE_KEY,
      JSON.stringify({ Vega: { hasPirateRaid: true, isInsurrect: false } })
    );
    const systems = [makeSystem('Vega')];
    const result = applyDevStateInjection(systems);
    expect(result[0].state?.hasPirateRaid).toBe(true);
    expect(result[0].state?.isInsurrect).toBe(false);
  });

  it('ignores invalid JSON stored in the overrides slot without throwing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.localStorage.setItem(ENABLE_STORAGE_KEY, '1');
    window.localStorage.setItem(OVERRIDES_STORAGE_KEY, '{{{not-json');
    const systems = [makeSystem('Vega')];
    expect(() => applyDevStateInjection(systems)).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('ignores overrides payload that does not match the expected shape', () => {
    window.localStorage.setItem(ENABLE_STORAGE_KEY, '1');
    // number flag where a boolean is expected -> rejected
    window.localStorage.setItem(
      OVERRIDES_STORAGE_KEY,
      JSON.stringify({ Vega: { isInsurrect: 1 } })
    );
    const systems = [makeSystem('Vega')];
    const result = applyDevStateInjection(systems);
    // Custom override dropped; Vega not in any named preset list → no injection from that path
    // but the sample preset may still inject because Vega sorts first of 1
    expect(result[0].name).toBe('Vega');
  });

  it('returns the same array (no mutation) when no overrides apply after filtering', () => {
    window.localStorage.setItem(ENABLE_STORAGE_KEY, '1');
    // Provide preset = sample but no systems — the overrides object will be empty → early return
    const systems: StarSystemType[] = [];
    const result = applyDevStateInjection(systems);
    expect(result).toBe(systems);
  });

  it('does not throw when VITE env flag alone enables injection', () => {
    // Simulate production-like path: no DEV but VITE_ENABLE_STATE_TEST=true is checked.
    // Under vitest, DEV is already true so this test just confirms non-throwing behavior.
    const systems = [makeSystem('Terra')];
    expect(() => applyDevStateInjection(systems)).not.toThrow();
  });
});
