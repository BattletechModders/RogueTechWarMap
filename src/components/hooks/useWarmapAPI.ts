import { useEffect, useState } from 'react';
import {
  DisplayStarSystemType,
  FactionDataType,
  StarSystemType,
} from './types';
import { findFaction, isCapital } from '../helpers';

const useWarmapAPI = () => {
  const [systems, setSystems] = useState<DisplayStarSystemType[]>([]);
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

  const projectSystems = (
    rawSystems: StarSystemType[]
  ): DisplayStarSystemType[] => {
    return rawSystems.map((value) => {
      const faction = findFaction(value.owner, factions);
      const displayName = faction?.prettyName || faction.Name;
      const projectedSystem: DisplayStarSystemType = {
        ...value,
        isCapital: isCapital(value.name, capitals),
        factionColour: faction && faction.colour ? faction.colour : 'gray',
        factionName: displayName,
      };

      return projectedSystem;
    });
  };

  useEffect(() => {
    const projectedSystems = projectSystems(rawSystems);
    setSystems(projectedSystems);
  }, [rawSystems]);

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
    systems,
    factions,
    capitals,
    fetchFactionData,
    fetchSystemData,
  };
};

export default useWarmapAPI;
