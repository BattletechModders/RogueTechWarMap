import { describe, expect, it } from 'vitest';
import { parseAdjacencyPairs } from './AdjacencyHelper';

describe('AdjacencyHelper', () => {
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
      ['starsystemdef_Terra', 'starsystemdef_Altair'],
      ['starsystemdef_Terra', 'starsystemdef_Caph'],
    ]);
  });

  it('returns an empty array for malformed payloads', () => {
    expect(parseAdjacencyPairs(null)).toEqual([]);
    expect(parseAdjacencyPairs({ pairs: [] })).toEqual([]);
    expect(parseAdjacencyPairs({ adjacencyMap: [] })).toEqual([]);
  });
});
