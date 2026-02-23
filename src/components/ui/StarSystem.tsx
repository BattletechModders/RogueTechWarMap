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
  const radius = (highlighted ? baseRadius * 3 : baseRadius) / zoomScaleFactor;

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
  );
};

export default memo(StarSystem);
