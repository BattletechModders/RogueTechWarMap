import { FactionDataType, FactionType } from '../hooks/types';

export function findFaction(
  factionKey: string,
  factions: FactionDataType
): FactionType | undefined {
  return factions[factionKey];
}
