import { describe, it, expect } from 'vitest';
import { buildFactionFilterOptions } from './gm.selectors';

describe('buildFactionFilterOptions', () => {
  it('returns unique, sorted faction names using prettyName when available', () => {
    const systems = [
      { owner: 'FACTION_A' },
      { owner: 'FACTION_B' },
      { owner: 'FACTION_A' }, // duplicate
      { owner: 'FACTION_C' },
    ] as any[];

    const factions = {
      FACTION_A: { prettyName: 'Alpha' },
      FACTION_B: { prettyName: 'Bravo' },
      FACTION_C: { prettyName: 'Charlie' },
    } as any;

    const result = buildFactionFilterOptions(systems, factions);

    expect(result).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('falls back to owner key when prettyName is missing or factions entry is absent', () => {
    const systems = [{ owner: 'FACTION_X' }, { owner: 'FACTION_Y' }] as any[];

    const factions = {
      FACTION_X: { prettyName: undefined },
    } as any;

    const result = buildFactionFilterOptions(systems, factions);

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

  it('returns an empty array when systems list is empty', () => {
    const result = buildFactionFilterOptions([] as any[], {} as any);
    expect(result).toEqual([]);
  });

  it('sorts case-sensitively via localeCompare', () => {
    const systems = [
      { owner: 'a' },
      { owner: 'b' },
      { owner: 'c' },
    ] as any[];
    const factions = {
      a: { prettyName: 'zebra' },
      b: { prettyName: 'Apple' },
      c: { prettyName: 'banana' },
    } as any;

    const result = buildFactionFilterOptions(systems, factions);
    expect(result).toEqual(['Apple', 'banana', 'zebra']);
  });
});
