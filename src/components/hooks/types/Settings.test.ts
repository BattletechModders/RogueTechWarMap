import { describe, it, expect, expectTypeOf } from 'vitest';
import { initialSettings, type Settings } from './Settings';

describe('Settings / initialSettings', () => {
  it('has the expected flashActivePlayes default', () => {
    expect(initialSettings).toEqual({ flashActivePlayes: true });
  });

  it('conforms to the Settings type', () => {
    expectTypeOf(initialSettings).toMatchTypeOf<Settings>();
    expectTypeOf(initialSettings.flashActivePlayes).toBeBoolean();
  });
});
