import { useState, useEffect } from 'react';

export interface StarSystemType {
  name: string;
  posX: number;
  posY: number;
  owner: string;
  sysUrl?: string;
}

export interface FactionType {
  capital: string;
  colour: string;
  id: number;
  prettyName: string;
}

export type FactionDataType = {
  [key: string]: FactionType;
};

const WarmapAPIFeeds = () => {
  const [systems, setSystems] = useState<StarSystemType[]>([]);
  const [capitals, setCapitals] = useState<string[]>([]);
  const [factions, setFactions] = useState<FactionDataType>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [systemData, factionData] = await Promise.all([
          fetch('https://roguewar.org/api/v1/starmap/warmap').then<
            StarSystemType[]
          >((res) => res.json()),
          fetch(
            'https://roguewar.org/api/v1/factions/warmap'
          ).then<FactionDataType>((res) => res.json()),
        ]);

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

export default WarmapAPIFeeds;
