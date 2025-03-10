import { memo } from 'react';
import { Circle } from 'react-konva';
import { StarSystemType } from '../hooks/useWarmapAPI';

interface StarSystemProps {
  system: StarSystemType;
  factionColor: string;
  factions: { [key: string]: { colour: string; prettyName: string } };
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
  factionColor,
  factions,
  showTooltip,
  hideTooltip,
  tooltip,
}) => {
  return (
    <Circle
      x={Number(system.posX)}
      y={-Number(system.posY)}
      radius={2.25}
      fill={factionColor}
      onClick={() => {
        if (system.sysUrl) {
          window.open(
            `https://www.roguewar.org${system.sysUrl}`,
            '_blank',
            'noopener,noreferrer'
          );
        }
      }}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        showTooltip(
          `${system.name}\n${
            factions[system.owner]?.prettyName || 'Unknown'
          }\n(${system.posX}, ${system.posY})`,
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
            window.open(
              `https://www.roguewar.org${system.sysUrl}`,
              '_blank',
              'noopener,noreferrer'
            );
            return;
          }

          showTooltip(
            `${system.name}\n${factions[system.owner]?.prettyName}\n(${
              system.posX
            }, ${system.posY})`,
            pointer.x,
            pointer.y
          );
        }
      }}
    />
  );
};

export default memo(StarSystem);
