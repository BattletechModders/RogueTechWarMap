import { memo, useEffect, useRef } from 'react';
import { Circle } from 'react-konva';
import Konva from 'konva';
import { findFaction, openInNewTab } from '../helpers';
import {
  DisplayStarSystemType,
  FactionDataType,
  Settings,
  StarSystemState,
  StarSystemType,
} from '../hooks/types';
import { API_BASE_URL } from '../helpers/ApiHelper.ts';

const CAPITAL_RADIUS = 2.5;
const PLANET_RADIUS = 1;

interface StarSystemProps {
  system: DisplayStarSystemType;
  factions: FactionDataType;
  zoomScaleFactor: number;
  settings: Settings;
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
  highlighted?: boolean;
  opacity?: number;
}

const StarSystem: React.FC<StarSystemProps> = ({
  system,
  zoomScaleFactor,
  factions,
  settings,
  showTooltip,
  hideTooltip,
  tooltip,
  highlighted = false,
  opacity = 1,
}) => {
  const baseRadius = system.isCapital ? CAPITAL_RADIUS : PLANET_RADIUS;
  const radius = (highlighted ? baseRadius * 3 : baseRadius) / zoomScaleFactor;

  const formatFactionControlCompact = (
    systemFactions: StarSystemType['factions'],
    allFactions: FactionDataType
  ) => {
    return systemFactions
      .map((faction) => {
        const factionData = findFaction(faction.Name, allFactions);
        const displayName = factionData?.prettyName || faction.Name;
        return `${displayName}: ${faction.control}% (${faction.ActivePlayers} players)`;
      })
      .join(' | ');
  };

  const hasActivePlayers = system.factions.some(
    (faction) => faction.ActivePlayers > 0
  );
  const damageLevelText =
    system.damageLevel !== undefined &&
    system.damageLevel !== null &&
    `${system.damageLevel}`.trim() !== ''
      ? `${system.damageLevel}`
      : 'Unknown';

  const formatSystemState = (state?: StarSystemState) => {
    if (!state) return 'None';

    const stateLabels: Array<[keyof StarSystemState, string]> = [
      ['isInsurrect', 'Insurrection'],
      ['hasPirateRaid', 'Pirate Raid'],
      ['hasCaptureEvent', 'Capture Event'],
      ['hasHoldTheLineEvent', 'Hold The Line Event'],
    ];

    const activeStates = stateLabels
      .filter(([key]) => state[key])
      .map(([, label]) => label);

    return activeStates.length ? activeStates.join(', ') : 'None';
  };

  const buildTooltipText = (includeTapHint = false) => {
    const ownerName = findFaction(system.owner, factions)?.prettyName || 'Unknown';
    const controlSummary = formatFactionControlCompact(system.factions, factions);
    const stateDetails = formatSystemState(system.state);

    const lines = [
      system.name,
      `(${system.posX}, ${system.posY})`,
      `Owner: ${ownerName}`,
      `Control: ${controlSummary}`,
      `Damage: ${damageLevelText}`,
    ];

    if (stateDetails !== 'None') {
      lines.push(`State: ${stateDetails}`);
    }

    if (includeTapHint) {
      lines.push('[Tap to open]');
    }

    return lines.join('\n');
  };

  const circleRef = useRef<Konva.Circle>(null);

  useEffect(() => {
    if (!settings.flashActivePlayes) return;
    if (!hasActivePlayers || !circleRef.current) return;

    const node = circleRef.current;

    const baseOpacity = opacity;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;

      const sine = Math.sin(frame.time * 0.005);
      const scale = sine * 0.1 + 1;
      const pulseOverlay = sine * 0.15 + 0.7;

      node.scale({ x: scale, y: scale });
      node.opacity(baseOpacity * pulseOverlay);
    }, node.getLayer());

    anim.start();

    return () => {
      anim.stop();
      node.opacity(baseOpacity);
    };
  }, [hasActivePlayers, settings, opacity]);

  return (
    <Circle
      ref={circleRef}
      x={Number(system.posX)}
      y={-Number(system.posY)}
      fill={system.factionColour}
      radius={radius}
      hitStrokeWidth={3}
      opacity={opacity}
      onClick={(e) => {
        e.cancelBubble = true;
        if (system.sysUrl) {
          openInNewTab(`${API_BASE_URL}${system.sysUrl}`);
        }
      }}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        showTooltip(buildTooltipText(), pointer.x, pointer.y, stage.x(), stage.y());
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
            window.location.href = `${API_BASE_URL}${system.sysUrl}`;
            return;
          }

          showTooltip(
            buildTooltipText(true),
            pointer.x,
            pointer.y,
            undefined,
            undefined,
            () => {
              window.location.href = `${API_BASE_URL}${system.sysUrl}`;
            }
          );
        }
      }}
    />
  );
};

export default memo(StarSystem);
