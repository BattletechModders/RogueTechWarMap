import { describe, it, expect } from 'vitest';
import * as helpers from './index';

describe('helpers barrel', () => {
  it('re-exports openInNewTab, findFaction, and isCapital', () => {
    expect(typeof helpers.openInNewTab).toBe('function');
    expect(typeof helpers.findFaction).toBe('function');
    expect(typeof helpers.isCapital).toBe('function');
  });

  it('does not leak unexpected exports', () => {
    const exported = Object.keys(helpers).sort();
    expect(exported).toEqual(['findFaction', 'isCapital', 'openInNewTab']);
  });
});
