import { describe, it, expect } from 'vitest';
import { isCapital } from './CapitalHelper';

describe('isCapital', () => {
  it('returns true when the system name is present in the capitals list', () => {
    expect(isCapital('Terra', ['Terra', 'Luthien'])).toBe(true);
  });

  it('returns false when the system is not a capital', () => {
    expect(isCapital('Altair', ['Terra', 'Luthien'])).toBe(false);
  });

  it('returns false for an empty capitals list', () => {
    expect(isCapital('Terra', [])).toBe(false);
  });

  it('matches case-sensitively (capital lookup is exact)', () => {
    expect(isCapital('terra', ['Terra'])).toBe(false);
    expect(isCapital('Terra', ['Terra'])).toBe(true);
  });
});
