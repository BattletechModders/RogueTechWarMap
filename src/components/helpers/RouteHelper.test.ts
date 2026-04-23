import { describe, it, expect } from 'vitest';
import { BASE_ROUTE } from './RouteHelper';

describe('RouteHelper.BASE_ROUTE', () => {
  it('resolves to VITE_BASE_URL when provided, otherwise "/"', () => {
    const expected = import.meta.env.VITE_BASE_URL || '/';
    expect(BASE_ROUTE).toBe(expected);
  });

  it('is a non-empty string', () => {
    expect(typeof BASE_ROUTE).toBe('string');
    expect(BASE_ROUTE.length).toBeGreaterThan(0);
  });
});
