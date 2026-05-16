import { FactionDataType, FactionType } from '../hooks/types';

export function findFaction(
  factionKey: string,
  factions: FactionDataType
): FactionType | undefined {
  const findResult = Object.entries(factions).find(
    ([key]) => key === factionKey
  );

  const faction = findResult?.[1];
  return faction;
}
