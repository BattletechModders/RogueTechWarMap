export type AdjacencyPair = [string, string];

const STAR_SYSTEM_DEF_PREFIX = 'starsystemdef_';

export const stripStarSystemDefPrefix = (name: string): string =>
  name.startsWith(STAR_SYSTEM_DEF_PREFIX)
    ? name.slice(STAR_SYSTEM_DEF_PREFIX.length)
    : name;

// Fold accented display names to ASCII before stripping punctuation so API ids
// like "starsystemdef_He-shi" can match display names like "Hè-shì".
export const normalizeAdjacencySystemName = (name: string): string =>
  stripStarSystemDefPrefix(name)
    .replace(/[Ää]/g, 'ae') // transliterations
    .replace(/[Öö]/g, 'oe')
    .replace(/[Üü]/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD') // unicode decomposition
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * normalizes the data from the adjacency/warmap API to be consumed by GalaxyMap
 * to draw the adjacency pairs
 * output of this will be a series of system pairs like ["Butzfleth", "Zathras"]
 * used to determine which systems need adjacency lines drawn between them.
 * @param data
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

        const from = stripStarSystemDefPrefix(fromName);
        const to = stripStarSystemDefPrefix(toName);
        const pairKey = [from, to].sort().join('\0');

        if (seen.has(pairKey)) {
          return;
        }

        seen.add(pairKey);
        pairs.push([from, to]);
      });
    }
  );

  return pairs;
};
