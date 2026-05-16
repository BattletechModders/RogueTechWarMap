import { describe, it, expect } from 'vitest';
import { findFaction } from './FactionHelper';
import type { FactionDataType } from '../hooks/types';

const factions: FactionDataType = {
  DAVION: { colour: '#ffcc00', prettyName: 'Davion', id: 1, capital: 'New Avalon' },
  KURITA: { colour: '#ff0000', prettyName: 'Kurita', id: 2, capital: 'Luthien' },
};

describe('findFaction', () => {
  it('returns the faction matching the key', () => {
    expect(findFaction('DAVION', factions)).toEqual(factions.DAVION);
  });

  it('returns undefined when the key is not present', () => {
    expect(findFaction('MISSING', factions)).toBeUndefined();
  });

  it('returns undefined for an empty faction map', () => {
    expect(findFaction('DAVION', {})).toBeUndefined();
  });

  it('does case-sensitive key matching', () => {
    expect(findFaction('davion', factions)).toBeUndefined();
  });
});
