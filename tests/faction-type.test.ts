import { describe, it, expectTypeOf } from 'vitest';
import type { FactionType } from '../src/components/hooks/types';

describe('FactionType', () => {
  it('capital is optional', () => {
    // A faction without a capital should be valid
    const faction: FactionType = {
      colour: 'red',
      prettyName: 'Test',
      id: 1,
    };
    expectTypeOf(faction.capital).toEqualTypeOf<string | undefined>();
  });
});
