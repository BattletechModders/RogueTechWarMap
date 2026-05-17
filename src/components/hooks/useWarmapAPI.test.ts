import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useWarmapAPI, { validateSystems, validateFactions } from './useWarmapAPI';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validSystem = {
  name: 'Terra',
  posX: 0,
  posY: 0,
  owner: 'ComStar',
  factions: [{ Name: 'ComStar', control: 100, ActivePlayers: 0 }],
};

const validFactionEntry = { colour: '#ffffff', prettyName: 'ComStar', id: 1, capital: 'Terra' };

// ---------------------------------------------------------------------------
// validateSystems
// ---------------------------------------------------------------------------

describe('validateSystems', () => {
  it('passes through well-formed system entries', () => {
    const result = validateSystems([validSystem]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Terra');
  });

  it('returns empty array when response is not an array', () => {
    expect(validateSystems(null)).toEqual([]);
    expect(validateSystems('oops')).toEqual([]);
    expect(validateSystems({ systems: [] })).toEqual([]);
  });

  it('drops entries missing required name field', () => {
    expect(validateSystems([{ posX: 0, posY: 0, owner: 'X', factions: [] }])).toHaveLength(0);
  });

  it('drops entries with empty name string', () => {
    expect(validateSystems([{ ...validSystem, name: '' }])).toHaveLength(0);
  });

  it('drops entries with missing posX', () => {
    expect(validateSystems([{ name: 'Terra', posY: 0, owner: 'X', factions: [] }])).toHaveLength(0);
  });

  it('drops entries with missing posY', () => {
    expect(validateSystems([{ name: 'Terra', posX: 0, owner: 'X', factions: [] }])).toHaveLength(0);
  });

  it('drops entries with missing owner', () => {
    expect(validateSystems([{ name: 'Terra', posX: 0, posY: 0, factions: [] }])).toHaveLength(0);
  });

  it('drops entries where factions is not an array', () => {
    expect(validateSystems([{ ...validSystem, factions: null }])).toHaveLength(0);
  });

  it('accepts string posX/posY for API flexibility', () => {
    const result = validateSystems([{ ...validSystem, posX: '10.5', posY: '-20' }]);
    expect(result).toHaveLength(1);
  });

  it('filters out bad entries while keeping valid ones', () => {
    const result = validateSystems([validSystem, { name: '' }, validSystem]);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// validateFactions
// ---------------------------------------------------------------------------

describe('validateFactions', () => {
  it('passes through well-formed faction entries', () => {
    const result = validateFactions({ ComStar: validFactionEntry });
    expect(result.ComStar.prettyName).toBe('ComStar');
  });

  it('returns empty object when response is not an object', () => {
    expect(validateFactions(null)).toEqual({});
    expect(validateFactions([])).toEqual({});
    expect(validateFactions('oops')).toEqual({});
  });

  it('drops faction entries missing colour', () => {
    const result = validateFactions({ ComStar: { prettyName: 'ComStar', id: 1 } });
    expect(result).not.toHaveProperty('ComStar');
  });

  it('drops faction entries missing prettyName', () => {
    const result = validateFactions({ ComStar: { colour: '#fff', id: 1 } });
    expect(result).not.toHaveProperty('ComStar');
  });

  it('keeps valid entries alongside bad ones', () => {
    const result = validateFactions({
      ComStar: validFactionEntry,
      Broken: { colour: 123 },
    });
    expect(result).toHaveProperty('ComStar');
    expect(result).not.toHaveProperty('Broken');
  });
});

// ---------------------------------------------------------------------------
// useWarmapAPI hook — fetch behaviour
// ---------------------------------------------------------------------------

describe('useWarmapAPI', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  const mockFetch = (factionResponse: unknown, systemResponse: unknown) => {
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      callCount++;
      const body = callCount === 1 ? factionResponse : systemResponse;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body),
      } as Response);
    });
  };

  it('starts in loading state with empty data', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: () => Promise.resolve([]) } as Response);
    const { result } = renderHook(() => useWarmapAPI());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.fetchError).toBeNull();
    expect(result.current.rawSystems).toEqual([]);
    expect(result.current.factions).toEqual({});
  });

  it('populates systems and factions on success', async () => {
    mockFetch({ ComStar: validFactionEntry }, [validSystem]);
    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => {
      await result.current.fetchFactionData();
      await result.current.fetchSystemData();
    });

    expect(result.current.fetchError).toBeNull();
    expect(result.current.rawSystems).toHaveLength(1);
    expect(result.current.rawSystems[0].name).toBe('Terra');
    expect(result.current.factions).toHaveProperty('ComStar');
    expect(result.current.factions).toHaveProperty('NoFaction');
  });

  it('extracts capitals from faction data', async () => {
    mockFetch({ ComStar: validFactionEntry }, [validSystem]);
    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => { await result.current.fetchFactionData(); });
    await act(async () => { await result.current.fetchSystemData(); });

    expect(result.current.capitals).toContain('Terra');
  });

  it('sets fetchError and clears systems when res.ok is false for systems', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ComStar: validFactionEntry }) } as Response)
      .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' } as Response);

    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => {
      await result.current.fetchFactionData();
      await result.current.fetchSystemData();
    });

    expect(result.current.fetchError).toMatch(/503/);
    expect(result.current.rawSystems).toHaveLength(0);
  });

  it('sets fetchError when res.ok is false for factions', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false, status: 404, statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => { await result.current.fetchFactionData(); });

    expect(result.current.fetchError).toMatch(/404/);
  });

  it('sets fetchError on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => { await result.current.fetchFactionData(); });

    expect(result.current.fetchError).toBe('Network error');
  });

  it('sets fetchError on malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Unexpected token')),
    } as Response);

    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => { await result.current.fetchFactionData(); });

    expect(result.current.fetchError).toBe('Unexpected token');
  });

  it('clears isLoading after both fetches complete', async () => {
    mockFetch({ ComStar: validFactionEntry }, [validSystem]);
    const { result } = renderHook(() => useWarmapAPI());

    expect(result.current.isLoading).toBe(true);

    await act(async () => { await result.current.fetchFactionData(); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => { await result.current.fetchSystemData(); });
    expect(result.current.isLoading).toBe(false);
  });

  it('clears isLoading even when a fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => {
      await result.current.fetchFactionData();
      await result.current.fetchSystemData();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets fetchError when the request times out (AbortError)', async () => {
    const abortError = Object.assign(new Error('signal timed out'), { name: 'TimeoutError' });
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);

    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => { await result.current.fetchFactionData(); });

    expect(result.current.fetchError).toBe('signal timed out');
    expect(result.current.isLoading).toBe(true); // systems fetch still pending
  });

  it('passes a signal to fetch so the request can be aborted on timeout', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const { result } = renderHook(() => useWarmapAPI());
    await act(async () => { await result.current.fetchFactionData(); });

    const callOptions = fetchSpy.mock.calls[0][1];
    expect(callOptions?.signal).toBeInstanceOf(AbortSignal);
  });

  it('silently drops malformed systems rather than crashing', async () => {
    const malformed = [{ name: '', posX: 0, posY: 0, owner: 'X', factions: [] }];
    mockFetch({}, malformed);
    const { result } = renderHook(() => useWarmapAPI());

    await act(async () => {
      await result.current.fetchFactionData();
      await result.current.fetchSystemData();
    });

    expect(result.current.rawSystems).toHaveLength(0);
    expect(result.current.fetchError).toBeNull();
  });
});
