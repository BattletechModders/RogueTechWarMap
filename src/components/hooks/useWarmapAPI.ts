import { useState, useEffect } from 'react';

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

export type FactionDataType = {
  [key: string]: FactionType;
};

const useWarmapAPI = () => {
  const [systems, setSystems] = useState([]);
  const [factions, setFactions] = useState<FactionDataType>({});
  const [capitals, setCapitals] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [systemData, factionData] = await Promise.all([
          fetch('https://roguewar.org/api/v1/starmap/warmap').then((res) =>
            res.json()
          ),
          fetch('https://roguewar.org/api/v1/factions/warmap').then((res) =>
            res.json()
          ),
        ]);

        factionData['NoFaction'] = {
          colour: 'gray',
          prettyName: 'Unaffiliated',
        };
        setSystems(systemData);
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

    fetchData();
  }, []);

  return { systems, factions, capitals };
};

export default useWarmapAPI;
