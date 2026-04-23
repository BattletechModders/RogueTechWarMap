import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from './ApiHelper';

describe('ApiHelper.API_BASE_URL', () => {
  it('resolves to the env-provided VITE_API_URL when set, otherwise the production fallback', () => {
    const expected = import.meta.env.VITE_API_URL || 'https://roguewar.org';
    expect(API_BASE_URL).toBe(expected);
  });

  it('is a non-empty string usable as a URL prefix', () => {
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_BASE_URL.length).toBeGreaterThan(0);
    expect(() => new URL('/api/v1/factions/warmap', API_BASE_URL)).not.toThrow();
  });
});
