import { memo } from 'react';
import { Circle } from 'react-konva';
import { findFaction, openInNewTab } from '../helpers';
import { FactionDataType, StarSystemType } from '../hooks/useWarmapAPI';

const CAPITAL_RADIUS = 2.5;
const PLANET_RADIUS = 1;

interface StarSystemProps {
  system: StarSystemType;
  isCapital: boolean;
  factionColor: string;
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
  isCapital,
  factionColor,
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
      radius={isCapital ? CAPITAL_RADIUS : PLANET_RADIUS}
      fill={factionColor}
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
            `${system.name}\n${faction?.prettyName}\n\nFaction Control:\n${controlDetails}`,
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
