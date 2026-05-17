import { describe, it, expect } from 'vitest';
import { isCapital } from './CapitalHelper';

describe('isCapital', () => {
  it('returns true when the system name is in the capitals list', () => {
    expect(isCapital('Terra', ['Terra', 'Sian', 'Luthien'])).toBe(true);
  });

  it('returns false when the system name is not in the list', () => {
    expect(isCapital('Solaris VII', ['Terra', 'Sian'])).toBe(false);
  });

  it('returns false for an empty capitals list', () => {
    expect(isCapital('Terra', [])).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isCapital('terra', ['Terra'])).toBe(false);
  });
});
