import { Circle } from 'react-konva';
import { StarSystemType } from '../hooks/warmapAPIFeeds';

interface StarSystemProps {
  system: StarSystemType;
  factionColor: string;
  factions: { [key: string]: { colour: string; prettyName: string } };
  showTooltip: (text: string, x: number, y: number) => void;
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
          window.location.href = `https://www.roguewar.org${system.sysUrl}`;
        }
      }}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const stageScale = stage.scaleX();

        showTooltip(
          `${system.name}\n${
            factions[system.owner]?.prettyName || 'Unknown'
          }\n(${system.posX}, ${system.posY})`,
          (pointer.x - stage.x()) / stageScale, // Adjust for scale
          (pointer.y - stage.y()) / stageScale // Adjust for scale
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
            window.location.href = `https://www.roguewar.org${system.sysUrl}`;
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

export default StarSystem;
