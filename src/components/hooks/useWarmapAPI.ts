import { useState } from 'react';
import { FactionDataType, StarSystemType } from './types';
import { API_BASE_URL } from '../helpers/ApiHelper.ts';

const useWarmapAPI = () => {
  const [rawSystems, setRawSystems] = useState<StarSystemType[]>([]);
  const [factions, setFactions] = useState<FactionDataType>({});
  const [capitals, setCapitals] = useState<string[]>([]);


  const fetchFactionData = async () => {
    try {
      const factionData = await fetch(
        `${API_BASE_URL}/api/v1/factions/warmap`
      ).then((res) => res.json());

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
    } catch {
      // Error handling deferred to Phase 2 (H4)
    }
  };

  const fetchSystemData = async () => {
    try {
      const systemData = await fetch(
        `${API_BASE_URL}/api/v1/starmap/warmap`
      ).then((res) => res.json());

      setRawSystems(systemData);
    } catch {
      // Error handling deferred to Phase 2 (H4)
    }
  };

  return {
    rawSystems,
    factions,
    capitals,
    fetchFactionData,
    fetchSystemData,
  };
};

export default useWarmapAPI;
