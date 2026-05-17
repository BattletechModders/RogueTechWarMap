import { useRef, useState } from 'react';
import { FactionDataType, FactionType, StarSystemType } from './types';
import { API_BASE_URL } from '../helpers/ApiHelper.ts';
import { applyDevStateInjection } from '../helpers/devStateInjector';

// ---------------------------------------------------------------------------
// Runtime shape guards — the API is external and can return anything.
// We filter out malformed entries rather than crashing, and warn so bad data
// is visible in the console without taking the whole map down.
// ---------------------------------------------------------------------------

export function validateSystems(data: unknown): StarSystemType[] {
  if (!Array.isArray(data)) {
    console.warn('[useWarmapAPI] systems response is not an array, got:', typeof data);
    return [];
  }
  return data.filter((item): item is StarSystemType => {
    if (!item || typeof item !== 'object') return false;
    const s = item as Record<string, unknown>;
    const valid =
      typeof s.name === 'string' && s.name.length > 0 &&
      (typeof s.posX === 'number' || typeof s.posX === 'string') &&
      (typeof s.posY === 'number' || typeof s.posY === 'string') &&
      !isNaN(Number(s.posX)) && !isNaN(Number(s.posY)) &&
      typeof s.owner === 'string' &&
      Array.isArray(s.factions);
    if (!valid) {
      console.warn('[useWarmapAPI] dropping malformed system entry:', s.name ?? item);
    }
    return valid;
  });
}

export function validateFactions(data: unknown): FactionDataType {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    console.warn('[useWarmapAPI] factions response has unexpected shape, got:', typeof data);
    return {};
  }
  const result: FactionDataType = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      console.warn(`[useWarmapAPI] dropping malformed faction entry: ${key}`);
      continue;
    }
    const f = value as Record<string, unknown>;
    if (typeof f.colour !== 'string' || typeof f.prettyName !== 'string') {
      console.warn(`[useWarmapAPI] faction "${key}" missing colour or prettyName, dropping`);
      continue;
    }
    result[key] = value as FactionType;
  }
  return result;
}

// ---------------------------------------------------------------------------

const useWarmapAPI = () => {
  const [rawSystems, setRawSystems] = useState<StarSystemType[]>([]);
  const [factions, setFactions] = useState<FactionDataType>({});
  const [capitals, setCapitals] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Count how many of the two initial fetches are still in flight.
  const pendingInitial = useRef(2);

  const markInitialDone = () => {
    pendingInitial.current -= 1;
    if (pendingInitial.current <= 0) setIsLoading(false);
  };

  const fetchFactionData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/factions/warmap`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`Factions request failed: ${res.status} ${res.statusText}`);
      const raw = await res.json();
      const factionData = validateFactions(raw);

      factionData['NoFaction'] = {
        colour: 'gray',
        prettyName: 'Unaffiliated',
      } as FactionType;
      setFactions(factionData);

      const caps: string[] = [];
      Object.keys(factionData).forEach((key) => {
        if (factionData[key].capital) caps.push(factionData[key].capital);
      });
      setCapitals(caps);
      setFetchError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load faction data';
      console.error(message, error);
      setFetchError(message);
    } finally {
      markInitialDone();
    }
  };

  const fetchSystemData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/starmap/warmap`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`Systems request failed: ${res.status} ${res.statusText}`);
      const raw = await res.json();
      const systemData = validateSystems(raw);

      setRawSystems(applyDevStateInjection(systemData));
      setFetchError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load system data';
      console.error(message, error);
      setFetchError(message);
    } finally {
      markInitialDone();
    }
  };

  return {
    rawSystems,
    factions,
    capitals,
    fetchError,
    isLoading,
    fetchFactionData,
    fetchSystemData,
  };
};

export default useWarmapAPI;
