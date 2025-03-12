import { useState } from 'react';

export interface StarSystemType {
  name: string;
  posX: number;
  posY: number;
  owner: string;
  sysUrl?: string;
}

export type FactionType = {
  colour: string;
  prettyName: string;
  id: number;
  capital: string;
};

export type FactionDataType = Record<string, FactionType>;

const useWarmapAPI = () => {
  const [systems, setSystems] = useState<StarSystemType[]>([]);
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

      setSystems(systemData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  return {
    systems,
    factions,
    capitals,
    fetchFactionData,
    fetchSystemData,
  };
};

export default useWarmapAPI;
