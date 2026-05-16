import { useRef, useState } from 'react';
import { FactionDataType, StarSystemType } from './types';
import { API_BASE_URL } from '../helpers/ApiHelper.ts';
import { applyDevStateInjection } from '../helpers/devStateInjector';

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
      const res = await fetch(`${API_BASE_URL}/api/v1/factions/warmap`);
      if (!res.ok) throw new Error(`Factions request failed: ${res.status} ${res.statusText}`);
      const factionData = await res.json();

      factionData['NoFaction'] = {
        colour: 'gray',
        prettyName: 'Unaffiliated',
      };
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
      const res = await fetch(`${API_BASE_URL}/api/v1/starmap/warmap`);
      if (!res.ok) throw new Error(`Systems request failed: ${res.status} ${res.statusText}`);
      const systemData = await res.json();

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
