import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useFiltering from './useFiltering';

const buildResponse = (payload: unknown) =>
  ({ ok: true, json: async () => payload } as unknown as Response);

describe('useFiltering', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes the composed API surface', () => {
    const { result } = renderHook(() => useFiltering());
    expect(result.current).toMatchObject({
      displaySystems: [],
      factions: {},
      capitals: [],
    });
    expect(typeof result.current.projectSystemData).toBe('function');
    expect(typeof result.current.fetchFactionData).toBe('function');
    expect(typeof result.current.fetchSystemData).toBe('function');
    expect(typeof result.current.setFlashActive).toBe('function');
    expect(result.current.settings).toEqual({ flashActivePlayers: true });
  });

  it('projectSystemData enriches raw systems with faction and capital fields', async () => {
    fetchMock
      .mockResolvedValueOnce(
        buildResponse({
          DAVION: {
            colour: '#ff0',
            prettyName: 'Davion',
            id: 1,
            capital: 'New Avalon',
          },
        })
      )
      .mockResolvedValueOnce(
        buildResponse([
          {
            name: 'New Avalon',
            posX: 1,
            posY: 2,
            owner: 'DAVION',
            factions: [],
          },
          {
            name: 'Random',
            posX: 3,
            posY: 4,
            owner: 'MISSING',
            factions: [],
          },
        ])
      );

    const { result } = renderHook(() => useFiltering());

    await act(async () => {
      await result.current.fetchFactionData();
    });
    await act(async () => {
      await result.current.fetchSystemData();
    });

    await waitFor(() => {
      expect(result.current.displaySystems.length).toBe(2);
    });

    const avalon = result.current.displaySystems.find((s) => s.name === 'New Avalon');
    const random = result.current.displaySystems.find((s) => s.name === 'Random');

    expect(avalon).toMatchObject({
      isCapital: true,
      factionColour: '#ff0',
      factionName: 'Davion',
    });
    expect(random).toMatchObject({
      isCapital: false,
      factionColour: 'gray',
      factionName: 'Unknown Faction',
    });
  });

  it('projectSystemData is a pure function and can be invoked directly', () => {
    const { result } = renderHook(() => useFiltering());
    const projected = result.current.projectSystemData([
      { name: 'Zeta', posX: 0, posY: 0, owner: 'DAVION', factions: [] },
    ]);
    // factions map is empty initially so faction lookup fails → defaults
    expect(projected[0]).toMatchObject({
      factionColour: 'gray',
      factionName: 'Unknown Faction',
    });
  });
});
