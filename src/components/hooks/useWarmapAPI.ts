import { useState, useEffect } from 'react';

export interface StarSystemType {
  name: string;
  posX: number;
  posY: number;
  owner: string;
  sysUrl?: string;
}

const useWarmapAPI = () => {
  const [systems, setSystems] = useState([]);
  const [factions, setFactions] = useState<{
    [key: string]: { colour: string; prettyName: string };
  }>({});

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
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  return { systems, factions };
};

export default useWarmapAPI;
