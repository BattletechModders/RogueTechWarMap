import { useCallback, useMemo } from 'react';
import { findFaction } from '../helpers';
import { DisplayStarSystemType, StarSystemType } from './types';
import useWarmapAPI from './useWarmapAPI';
import useSettings from './useSettings';

const useFiltering = () => {
  const { rawSystems, factions, capitals, fetchFactionData, fetchSystemData } =
    useWarmapAPI();

  const { settings, setFlashActive } = useSettings();
  const capitalSet = useMemo(() => new Set(capitals), [capitals]);

  const projectSystemData = useCallback(
    (rawSystems: StarSystemType[]): DisplayStarSystemType[] => {
      return rawSystems.map((value) => {
        const faction = findFaction(value.owner, factions);
        const displayName = faction?.prettyName ?? 'Unknown Faction';
        const projectedSystem: DisplayStarSystemType = {
          ...value,
          isCapital: capitalSet.has(value.name),
          factionColour: faction && faction.colour ? faction.colour : 'gray',
          factionName: displayName,
          normalizedName: value.name.toLowerCase(),
        };

        return projectedSystem;
      });
    },
    [capitalSet, factions]
  );

  const displaySystems = useMemo(
    () => projectSystemData(rawSystems),
    [projectSystemData, rawSystems]
  );

  return {
    displaySystems,
    projectSystemData,
    factions,
    capitals,
    fetchFactionData,
    fetchSystemData,
    settings,
    setFlashActive,
  };
};

export default useFiltering;
