import { describe, it, expect } from 'vitest';
import { findFaction } from '../../src/components/helpers/FactionHelper';
import type { FactionDataType } from '../../src/components/hooks/types';

const testFactions: FactionDataType = {
  Steiner: { colour: 'blue', prettyName: 'House Steiner', id: 1, capital: 'Tharkad' },
  Davion: { colour: 'gold', prettyName: 'House Davion', id: 2, capital: 'New Avalon' },
  NoFaction: { colour: 'gray', prettyName: 'Unaffiliated', id: 0, capital: '' },
};

describe('findFaction', () => {
  it('returns the correct faction when key exists', () => {
    const result = findFaction('Steiner', testFactions);
    expect(result).toEqual(testFactions['Steiner']);
  });

  it('returns undefined when key does not exist', () => {
    const result = findFaction('NonExistent', testFactions);
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty factions object', () => {
    const result = findFaction('Steiner', {});
    expect(result).toBeUndefined();
  });

  it('is case-sensitive', () => {
    const result = findFaction('steiner', testFactions);
    expect(result).toBeUndefined();
  });

  it('finds the NoFaction special key', () => {
    const result = findFaction('NoFaction', testFactions);
    expect(result?.prettyName).toBe('Unaffiliated');
  });

  it('returns a FactionType with expected fields', () => {
    const result = findFaction('Davion', testFactions);
    expect(result).toBeDefined();
    expect(result!.colour).toBe('gold');
    expect(result!.prettyName).toBe('House Davion');
    expect(result!.id).toBe(2);
    expect(result!.capital).toBe('New Avalon');
  });
});
