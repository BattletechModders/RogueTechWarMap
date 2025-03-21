import { memo } from 'react';
import { Circle } from 'react-konva';
import { findFaction, openInNewTab } from '../helpers';
import {
  DisplayStarSystemType,
  FactionDataType,
  StarSystemType,
} from '../hooks/types';

const CAPITAL_RADIUS = 2.5;
const PLANET_RADIUS = 1;

interface StarSystemProps {
  system: DisplayStarSystemType;
  factions: FactionDataType;
  showTooltip: (
    text: string,
    x: number,
    y: number,
    stageX?: number,
    stageY?: number,
    onTouch?: () => void
  ) => void;
  hideTooltip: () => void;
  tooltip: { visible: boolean; text: string };
}

const StarSystem: React.FC<StarSystemProps> = ({
  system,
  factions,
  showTooltip,
  hideTooltip,
  tooltip,
}) => {
  const formatFactionControl = (
    factions: StarSystemType['factions'],
    allFactions: FactionDataType
  ) => {
    return factions
      .map((faction) => {
        const factionData = findFaction(faction.Name, allFactions);
        const displayName = factionData?.prettyName || faction.Name;
        return `${displayName}: ${faction.control}%\n (${faction.ActivePlayers} players)`;
      })
      .join('\n');
  };

  return (
    <Circle
      x={Number(system.posX)}
      y={-Number(system.posY)}
      radius={system.isCapital ? CAPITAL_RADIUS : PLANET_RADIUS}
      fill={system.factionColour}
      onClick={() => {
        if (system.sysUrl) {
          openInNewTab(`https://www.roguewar.org${system.sysUrl}`);
        }
      }}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const faction = findFaction(system.owner, factions);
        const controlDetails = formatFactionControl(system.factions, factions);

        showTooltip(
          `${system.name}\n${
            faction?.prettyName || 'Unknown'
          }\n\nFaction Control:\n${controlDetails}`,
          // `${system.name}\n${faction?.prettyName || 'Unknown'}\n(${
          //   system.posX
          // }, ${system.posY})\n\nFaction Control:\n${controlDetails}`,
          pointer.x,
          pointer.y,
          stage.x(),
          stage.y()
        );
      }}
      onMouseLeave={hideTooltip}
      onTouchStart={(e) => {
        if (e.evt.touches.length === 1) {
          e.evt.preventDefault();
          const stage = e.target.getStage();
          if (!stage) return;

          const pointer = stage.getRelativePointerPosition();
          if (!pointer) return;

          if (tooltip.visible && tooltip.text.includes(system.name)) {
            openInNewTab(`https://www.roguewar.org${system.sysUrl}`);
            return;
          }

          const faction = findFaction(system.owner, factions);
          const controlDetails = formatFactionControl(
            system.factions,
            factions
          );

          showTooltip(
            `${system.name}\n${faction?.prettyName}\n\nFaction Control:\n${controlDetails}\n\n[Tap to open]`,
            // `${system.name}\n${faction?.prettyName}\n(${system.posX}, ${system.posY})\n\nFaction Control:\n${controlDetails}`,
            pointer.x,
            pointer.y,
            undefined,
            undefined,
            () => openInNewTab(`https://www.roguewar.org${system.sysUrl}`)
          );
        }
      }}
    />
  );
};

export default memo(StarSystem);
