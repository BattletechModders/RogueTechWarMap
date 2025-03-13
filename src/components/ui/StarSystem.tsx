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
  scale: number;
  showTooltip: (
    text: string,
    x: number,
    y: number,
    stageX?: number,
    stageY?: number
  ) => void;
  hideTooltip: () => void;
  tooltip: { visible: boolean; text: string };
}

const StarSystem: React.FC<StarSystemProps> = ({
  system,
  isCapital,
  scale,
  factionColor,
  factions,
  showTooltip,
  hideTooltip,
  tooltip,
}) => {
  const radius =
    (isCapital ? CAPITAL_RADIUS : PLANET_RADIUS) / (scale < 1 ? scale : 1);

  return (
    <Circle
      x={Number(system.posX)}
      y={-Number(system.posY)}
      radius={radius}
      fill={factionColor}
      onDblClick={() => {
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

        showTooltip(
          `${system.name}\n${faction?.prettyName || 'Unknown'}\n(${
            system.posX
          }, ${system.posY})`,
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

          showTooltip(
            `${system.name}\n${faction?.prettyName}\n(${system.posX}, ${system.posY})`,
            pointer.x,
            pointer.y
          );
        }
      }}
    />
  );
};

export default memo(StarSystem);
