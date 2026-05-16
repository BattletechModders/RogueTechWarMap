import type { DisplayStarSystemType, FactionDataType } from '../hooks/types';

export function buildFactionFilterOptions(
  systems: DisplayStarSystemType[],
  factions: FactionDataType
): string[] {
  const names = new Set<string>();

  for (const system of systems) {
    const owner = system.owner;
    const pretty = factions[owner]?.prettyName ?? owner;
    if (pretty) names.add(pretty);
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b));
}
