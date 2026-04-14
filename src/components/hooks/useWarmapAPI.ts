import { useState } from 'react';
import { FactionDataType, StarSystemType } from './types';
import { API_BASE_URL } from '../helpers/ApiHelper.ts';

const useWarmapAPI = () => {
  const [rawSystems, setRawSystems] = useState<StarSystemType[]>([]);
  const [factions, setFactions] = useState<FactionDataType>({});
  const [capitals, setCapitals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFactionData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/factions/warmap`);
      if (!res.ok) throw new Error(`Faction API returned ${res.status}`);
      const factionData = await res.json();

      if (
        !factionData ||
        typeof factionData !== 'object' ||
        Array.isArray(factionData)
      ) {
        throw new Error('Faction API returned unexpected data shape');
      }

      factionData['NoFaction'] = {
        colour: 'gray',
        prettyName: 'Unaffiliated',
      };
      setFactions(factionData);

      const capitals: string[] = [];

      Object.keys(factionData).forEach((key) => {
        if (factionData[key].capital) {
          capitals.push(factionData[key].capital);
        }
      });

      setCapitals(capitals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch faction data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemData = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/starmap/warmap`);
      if (!res.ok) throw new Error(`System API returned ${res.status}`);
      const systemData = await res.json();

      if (!Array.isArray(systemData)) {
        throw new Error('System API returned unexpected data shape');
      }

      setRawSystems(systemData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system data');
    }
  };

  return {
    rawSystems,
    factions,
    capitals,
    fetchFactionData,
    fetchSystemData,
    isLoading,
    error,
  };
};

export default useWarmapAPI;
