import { describe, it, expect } from 'vitest';
import { isCapital } from '../../src/components/helpers/CapitalHelper';

const capitals = ['Tharkad', 'New Avalon', 'Luthien', 'Atreus'];

describe('isCapital', () => {
  it('returns true when system is in the capitals list', () => {
    expect(isCapital('Tharkad', capitals)).toBe(true);
  });

  it('returns false when system is not in the capitals list', () => {
    expect(isCapital('Solaris VII', capitals)).toBe(false);
  });

  it('returns false for empty capitals array', () => {
    expect(isCapital('Tharkad', [])).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isCapital('tharkad', capitals)).toBe(false);
    expect(isCapital('THARKAD', capitals)).toBe(false);
  });

  it('matches multi-word system names', () => {
    expect(isCapital('New Avalon', capitals)).toBe(true);
  });

  it('returns false for empty system name', () => {
    expect(isCapital('', capitals)).toBe(false);
  });
});
