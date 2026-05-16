import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useSettings from './useSettings';
import { initialSettings } from './types';

describe('useSettings', () => {
  it('returns the initial settings on mount', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual(initialSettings);
  });

  it('setFlashActive(false) toggles flashActivePlayers off', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setFlashActive(false);
    });

    expect(result.current.settings.flashActivePlayers).toBe(false);
  });

  it('setFlashActive(true) toggles it back on without mutating previous state', () => {
    const { result } = renderHook(() => useSettings());

    act(() => result.current.setFlashActive(false));
    const firstSettings = result.current.settings;

    act(() => result.current.setFlashActive(true));

    expect(result.current.settings.flashActivePlayers).toBe(true);
    // previous state reference should not have been mutated
    expect(firstSettings.flashActivePlayers).toBe(false);
  });
});
