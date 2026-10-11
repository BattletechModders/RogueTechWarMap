import { describe, expect, it } from 'vitest';
import {
  normalizeAdjacencySystemName,
  parseAdjacencyPairs,
  stripStarSystemDefPrefix,
} from './AdjacencyHelper';

describe('AdjacencyHelper', () => {
  it('strips the starsystemdef_ prefix', () => {
    expect(stripStarSystemDefPrefix('starsystemdef_Terra')).toBe('Terra');
    expect(stripStarSystemDefPrefix('Terra')).toBe('Terra');
  });

  it('normalizes adjacency ids and display names to the same key', () => {
    expect(normalizeAdjacencySystemName('starsystemdef_WynnsRoost')).toBe(
      normalizeAdjacencySystemName("Wynn's Roost")
    );
    expect(normalizeAdjacencySystemName('starsystemdef_Elbing(FWL)')).toBe(
      normalizeAdjacencySystemName('Elbing (FWL)')
    );
    expect(normalizeAdjacencySystemName('starsystemdef_He-shi')).toBe(
      normalizeAdjacencySystemName('Hè-shì')
    );
    expect(normalizeAdjacencySystemName('starsystemdef_UrCruinne')).toBe(
      normalizeAdjacencySystemName('Úr Cruinne')
    );
    expect(normalizeAdjacencySystemName('starsystemdef_Koeln(FWL)')).toBe(
      normalizeAdjacencySystemName('Köln (FWL)')
    );
  });

  it('parses adjacencyMap entries', () => {
    expect(
      parseAdjacencyPairs({
        adjacencyMap: {
          starsystemdef_Terra: ['starsystemdef_Altair', 'starsystemdef_Caph'],
          starsystemdef_Altair: ['starsystemdef_Terra'],
          starsystemdef_Butzfleth: 'broken',
          starsystemdef_Junk: [null],
        },
      })
    ).toEqual([
      ['Terra', 'Altair'],
      ['Terra', 'Caph'],
    ]);
  });

  it('returns an empty array for malformed payloads', () => {
    expect(parseAdjacencyPairs(null)).toEqual([]);
    expect(parseAdjacencyPairs({ pairs: [] })).toEqual([]);
    expect(parseAdjacencyPairs({ adjacencyMap: [] })).toEqual([]);
  });
});
