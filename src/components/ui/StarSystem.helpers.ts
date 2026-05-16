import type {
  FactionDataType,
  StarSystemState,
  StarSystemType,
} from '../hooks/types';
import type { TooltipControlItem } from '../GalaxyMap/gm.types';
import { findFaction } from '../helpers';

export const buildControlItems = (
  systemFactions: StarSystemType['factions'],
  allFactions: FactionDataType
): TooltipControlItem[] => {
  return [...systemFactions]
    .sort((a, b) => b.control - a.control)
    .map((faction) => {
      const factionData = findFaction(faction.Name, allFactions);
      return {
        name: factionData?.prettyName || faction.Name,
        control: faction.control,
        players: faction.ActivePlayers,
      };
    });
};

export const formatControlLine = (item: TooltipControlItem): string =>
  `${item.name} ${item.control}% · ${item.players}`;

const STATE_LABELS: Array<[keyof StarSystemState, string]> = [
  ['isInsurrect', 'Insurrection'],
  ['hasPirateRaid', 'Pirate Raid'],
  ['hasCaptureEvent', 'Capture Event'],
  ['hasHoldTheLineEvent', 'Hold The Line Event'],
];

export const formatSystemState = (state?: StarSystemState): string => {
  if (!state) return 'None';
  const activeStates = STATE_LABELS.filter(([key]) => state[key]).map(
    ([, label]) => label
  );
  return activeStates.length ? activeStates.join(', ') : 'None';
};

export const formatDamageLevel = (
  damageLevel: StarSystemType['damageLevel']
): string => {
  if (
    damageLevel === undefined ||
    damageLevel === null ||
    `${damageLevel}`.trim() === ''
  ) {
    return 'Unknown';
  }
  return `${damageLevel}`;
};

export interface BuildTooltipTextArgs {
  system: StarSystemType;
  factions: FactionDataType;
  includeTapHint?: boolean;
}

export interface BuildTooltipTextResult {
  text: string;
  controlItems: TooltipControlItem[];
}

export const buildTooltipText = ({
  system,
  factions,
  includeTapHint = false,
}: BuildTooltipTextArgs): BuildTooltipTextResult => {
  const ownerName =
    findFaction(system.owner, factions)?.prettyName || 'Unknown';
  const controlItems = buildControlItems(system.factions, factions);
  const topControl = controlItems.slice(0, 3);
  const remainingControlCount = Math.max(
    0,
    controlItems.length - topControl.length
  );
  const stateDetails = formatSystemState(system.state);
  const damageLevelText = formatDamageLevel(system.damageLevel);

  const lines = [
    system.name,
    `(${system.posX}, ${system.posY})`,
    `Owner: ${ownerName}`,
    'Control:',
    ...topControl.map(formatControlLine),
    ...(remainingControlCount > 0 ? [`+${remainingControlCount} more`] : []),
    `Damage: ${damageLevelText}`,
  ];

  if (stateDetails !== 'None') {
    lines.push(`State: ${stateDetails}`);
  }

  if (includeTapHint) {
    lines.push('[Tap to open]');
  }

  return { text: lines.join('\n'), controlItems };
};
