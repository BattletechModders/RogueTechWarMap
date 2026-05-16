import { describe, it, expect } from 'vitest';
import { buildFactionFilterOptions } from '../src/components/GalaxyMap/gm.selectors';

describe('buildFactionFilterOptions', () => {
  it('returns unique, sorted faction names using prettyName when available', () => {
    const systems = [
      { owner: 'FACTION_A' },
      { owner: 'FACTION_B' },
      { owner: 'FACTION_A' }, // duplicate
      { owner: 'FACTION_C' },
    ] as any[]; // minimal shape: just needs owner

    const factions = {
      FACTION_A: { prettyName: 'Alpha' },
      FACTION_B: { prettyName: 'Bravo' },
      FACTION_C: { prettyName: 'Charlie' },
    } as any;

    const result = buildFactionFilterOptions(systems, factions);

    // unique + sorted alphabetically by prettyName
    expect(result).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('falls back to owner key when prettyName is missing', () => {
    const systems = [{ owner: 'FACTION_X' }, { owner: 'FACTION_Y' }] as any[];

    const factions = {
      FACTION_X: { prettyName: undefined },
      // FACTION_Y completely missing from map
    } as any;

    const result = buildFactionFilterOptions(systems, factions);

    // falls back to owner string
    expect(result.sort()).toEqual(['FACTION_X', 'FACTION_Y'].sort());
  });

  it('ignores falsy names (null/empty string)', () => {
    const systems = [
      { owner: 'FACTION_NULL' },
      { owner: 'FACTION_EMPTY' },
      { owner: 'FACTION_OK' },
    ] as any[];

    const factions = {
      FACTION_NULL: { prettyName: null },
      FACTION_EMPTY: { prettyName: '' },
      FACTION_OK: { prettyName: 'Valid' },
    } as any;

    const result = buildFactionFilterOptions(systems, factions);

    expect(result).toEqual(['FACTION_NULL', 'Valid']);
  });
});
