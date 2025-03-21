import { useState } from 'react';
import { FactionDataType, StarSystemType } from './types';

const useWarmapAPI = () => {
  const [rawSystems, setRawSystems] = useState<StarSystemType[]>([]);
  const [factions, setFactions] = useState<FactionDataType>({});
  const [capitals, setCapitals] = useState<string[]>([]);

  const fetchFactionData = async () => {
    try {
      const factionData = await fetch(
        'https://roguewar.org/api/v1/factions/warmap'
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
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchSystemData = async () => {
    try {
      const systemData = await fetch(
        'https://roguewar.org/api/v1/starmap/warmap'
      ).then((res) => res.json());

      setRawSystems(systemData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
