import { memo } from 'react';
import { Circle } from 'react-konva';
import { findFaction, openInNewTab } from '../helpers';
import {
  DisplayStarSystemType,
  FactionDataType,
  Settings,
  StarSystemState,
  StarSystemType,
} from '../hooks/types';
import { API_BASE_URL } from '../helpers/ApiHelper.ts';
import type { TooltipControlItem } from '../GalaxyMap/gm.types';

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
    onTouch?: () => void,
    controlItems?: TooltipControlItem[]
  ) => void;
  hideTooltip: () => void;
  tooltipVisibleRef: React.MutableRefObject<boolean>;
  touchedSystemNameRef: React.MutableRefObject<string | null>;
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
  tooltipVisibleRef,
  touchedSystemNameRef,
  highlighted = false,
  opacity = 1,
}) => {
  const baseRadius = system.isCapital ? CAPITAL_RADIUS : PLANET_RADIUS;

  const buildControlItems = (
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

  const formatControlLine = (item: TooltipControlItem) => {
    return `${item.name} ${item.control}% · P${item.players}`;
  };

  const hasActivePlayers = system.factions.some(
    (faction) => faction.ActivePlayers > 0
  );
  const showActivePlayerIndicator =
    settings.flashActivePlayes && hasActivePlayers;
  const activePlayerRadiusMultiplier = showActivePlayerIndicator ? 1.25 : 1;
  const radius =
    ((highlighted ? baseRadius * 3 : baseRadius) * activePlayerRadiusMultiplier) /
    zoomScaleFactor;
  const centerX = Number(system.posX);
  const centerY = -Number(system.posY);
  const circleOpacity = showActivePlayerIndicator
    ? Math.min(1, opacity + 0.25)
    : opacity;
  const haloRadius = radius * 1.9;
  const haloOpacity = Math.min(0.34, circleOpacity * 0.4);
  const rimOpacity = Math.min(0.4, circleOpacity * 0.4);
  const shineRadius = radius * 0.45;
  const shineOpacity = Math.min(0.42, circleOpacity * 0.45);
  const shineOffset = radius * 0.35;
  const shineCenterColor = `rgba(255,255,255,${shineOpacity})`;
  const shineEdgeColor = 'rgba(255,255,255,0)';
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
    const controlItems = buildControlItems(system.factions, factions);
    const topControl = controlItems.slice(0, 3);
    const remainingControlCount = Math.max(0, controlItems.length - topControl.length);
    const stateDetails = formatSystemState(system.state);

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

    return {
      text: lines.join('\n'),
      controlItems,
    };
  };

  return (
    <>
      {showActivePlayerIndicator && (
        <Circle
          x={centerX}
          y={centerY}
          fill={system.factionColour}
          radius={haloRadius}
          opacity={haloOpacity}
          listening={false}
        />
      )}
      {showActivePlayerIndicator && (
        <Circle
          x={centerX}
          y={centerY}
          radius={radius}
          stroke="#ffffff"
          strokeWidth={Math.max(0.2, radius * 0.14)}
          opacity={rimOpacity}
          listening={false}
        />
      )}
      <Circle
        x={centerX}
        y={centerY}
        fill={system.factionColour}
        radius={radius}
        hitStrokeWidth={3}
        opacity={circleOpacity}
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

          const tooltipData = buildTooltipText();
          showTooltip(
            tooltipData.text,
            pointer.x,
            pointer.y,
            stage.x(),
            stage.y(),
            undefined,
            tooltipData.controlItems
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

            if (
              tooltipVisibleRef.current &&
              touchedSystemNameRef.current === system.name
            ) {
              window.location.href = `${API_BASE_URL}${system.sysUrl}`;
              return;
            }

            const tooltipData = buildTooltipText(true);

            showTooltip(
              tooltipData.text,
              pointer.x,
              pointer.y,
              undefined,
              undefined,
              () => {
                window.location.href = `${API_BASE_URL}${system.sysUrl}`;
              },
              tooltipData.controlItems
            );
            touchedSystemNameRef.current = system.name;
          }
        }}
      />
      {showActivePlayerIndicator && (
        <Circle
          x={centerX - shineOffset}
          y={centerY - shineOffset}
          radius={shineRadius}
          fillRadialGradientStartPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndRadius={shineRadius}
          fillRadialGradientColorStops={[0, shineCenterColor, 1, shineEdgeColor]}
          listening={false}
        />
      )}
    </>
  );
};

export default memo(StarSystem);
