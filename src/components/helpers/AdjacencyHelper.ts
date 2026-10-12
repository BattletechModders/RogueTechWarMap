export type AdjacencyPair = [string, string];

/**
 * output of this will be a series of system coreId pairs like
 * ["starsystemdef_Butzfleth", "starsystemdef_Zathras"]
 * the pairs are used to determine which systems need adjacency lines drawn between them.
 * consumed by GalaxyMap for adjacency line rendering
 * @param data data from the adjacency API in the form { adjacencyMap: { starsystemdef_Butzfleth: ['starsystemdef_Zathras', ...]}}
 */
export const parseAdjacencyPairs = (data: unknown): AdjacencyPair[] => {
  const adjacencyMap = (data as { adjacencyMap?: unknown } | null)
    ?.adjacencyMap;

  if (
    !adjacencyMap ||
    typeof adjacencyMap !== 'object' ||
    Array.isArray(adjacencyMap)
  ) {
    return [];
  }

  const seen = new Set<string>();
  const pairs: AdjacencyPair[] = [];

  // Sort each pair key so mirrored entries only produce one rendered line.
  Object.entries(adjacencyMap as Record<string, unknown>).forEach(
    ([fromName, toNames]) => {
      if (!Array.isArray(toNames)) {
        return;
      }

      toNames.forEach((toName) => {
        if (typeof toName !== 'string') {
          return;
        }

        const pairKey = [fromName, toName].sort().join('\0');

        if (seen.has(pairKey)) {
          return;
        }

        seen.add(pairKey);
        pairs.push([fromName, toName]);
      });
    }
  );

  return pairs;
};
