import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useWarmapAPI from './useWarmapAPI';

type FetchMock = ReturnType<typeof vi.fn>;

const buildResponse = (payload: unknown) =>
  ({
    ok: true,
    json: async () => payload,
  } as unknown as Response);

describe('useWarmapAPI', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts with empty state before any fetch', () => {
    const { result } = renderHook(() => useWarmapAPI());
    expect(result.current.rawSystems).toEqual([]);
    expect(result.current.factions).toEqual({});
    expect(result.current.capitals).toEqual([]);
  });

  it('fetchFactionData normalizes NoFaction and derives capitals', async () => {
    fetchMock.mockResolvedValue(
      buildResponse({
        DAVION: { colour: '#ff0', prettyName: 'Davion', id: 1, capital: 'New Avalon' },
        LIAO: { colour: '#0f0', prettyName: 'Liao', id: 2, capital: 'Sian' },
        UNALIGNED: { colour: '#444', prettyName: 'Loose', id: 3 }, // no capital
      })
    );

    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => {
      await result.current.fetchFactionData();
    });

    await waitFor(() => {
      expect(result.current.factions.NoFaction).toEqual({
        colour: 'gray',
        prettyName: 'Unaffiliated',
      });
    });
    expect(result.current.factions.DAVION.prettyName).toBe('Davion');
    // capitals include only factions with a `capital` property set
    expect(new Set(result.current.capitals)).toEqual(new Set(['New Avalon', 'Sian']));
  });

  it('fetchSystemData stores raw systems returned from the endpoint', async () => {
    fetchMock.mockResolvedValue(
      buildResponse([
        { name: 'Terra', posX: 0, posY: 0, owner: 'NoFaction', factions: [] },
        { name: 'Luthien', posX: 10, posY: 20, owner: 'KURITA', factions: [] },
      ])
    );

    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => {
      await result.current.fetchSystemData();
    });

    await waitFor(() => {
      expect(result.current.rawSystems).toHaveLength(2);
    });
    expect(result.current.rawSystems[0].name).toBe('Terra');
  });

  it('logs and swallows fetch errors (fetchFactionData)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => {
      await result.current.fetchFactionData();
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(result.current.factions).toEqual({});
    errorSpy.mockRestore();
  });

  it('logs and swallows fetch errors (fetchSystemData)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => {
      await result.current.fetchSystemData();
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(result.current.rawSystems).toEqual([]);
    errorSpy.mockRestore();
  });
});
