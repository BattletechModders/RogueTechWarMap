import { useCallback, useEffect, useState } from 'react';
import { findFaction, isCapital } from '../helpers';
import { DisplayStarSystemType, StarSystemType } from './types';
import useWarmapAPI from './useWarmapAPI';
import useSettings from './useSettings';

const useFiltering = () => {
  const [displaySystems, setDisplaySystems] = useState<DisplayStarSystemType[]>(
    []
  );
  const { rawSystems, factions, capitals, fetchFactionData, fetchSystemData, isLoading, error } =
    useWarmapAPI();

  const { settings } = useSettings();

  const projectSystemData = useCallback(
    (rawSystems: StarSystemType[]): DisplayStarSystemType[] => {
      return rawSystems.map((value) => {
        const faction = findFaction(value.owner, factions);
        const displayName = faction?.prettyName ?? 'Unknown Faction';
        const projectedSystem: DisplayStarSystemType = {
          ...value,
          isCapital: isCapital(value.name, capitals),
          factionColour: faction && faction.colour ? faction.colour : 'gray',
          factionName: displayName,
        };

        return projectedSystem;
      });
    },
    [capitals, factions]
  );

  useEffect(() => {
    const projectedSystems = projectSystemData(rawSystems);
    setDisplaySystems(projectedSystems);
  }, [rawSystems, capitals, factions, projectSystemData]);

  return {
    displaySystems,
    factions,
    capitals,
    fetchFactionData,
    fetchSystemData,
    settings,
    isLoading,
    error,
  };
};

export default useFiltering;
