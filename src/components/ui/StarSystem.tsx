import { memo, useEffect, useRef, useState } from 'react';
import { Circle, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { findFaction, openInNewTab } from '../helpers';
import pirateIconUrl from '../../assets/joli-rouge-icon.svg';
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
let pirateIconImageCache: HTMLImageElement | null = null;
let pirateIconImagePromise: Promise<HTMLImageElement> | null = null;

const loadPirateIconImage = (): Promise<HTMLImageElement> => {
  if (pirateIconImageCache) return Promise.resolve(pirateIconImageCache);
  if (pirateIconImagePromise) return pirateIconImagePromise;

  pirateIconImagePromise = new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = pirateIconUrl;
    image.onload = () => {
      pirateIconImageCache = image;
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error('Failed to load pirate raid icon.'));
    };
  });

  return pirateIconImagePromise;
};

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
  const isInsurrect = !!system.state?.isInsurrect;
  const hasPirateRaid = !!system.state?.hasPirateRaid;
  const showActivePlayerIndicator =
    settings.flashActivePlayes && hasActivePlayers;
  const activePlayerRadiusMultiplier = showActivePlayerIndicator ? 1.25 : 1;
  const radius =
    ((highlighted ? baseRadius * 3 : baseRadius) *
      activePlayerRadiusMultiplier) /
    zoomScaleFactor;
  const centerX = Number(system.posX);
  const centerY = -Number(system.posY);
  const circleOpacity = showActivePlayerIndicator
    ? Math.min(1, opacity + 0.25)
    : opacity;
  const haloRadius = radius * 2.5;
  const haloOpacity = Math.min(0.34, circleOpacity * 0.4);
  const rimOpacity = Math.min(0.4, circleOpacity * 0.4);
  const shineRadius = radius * 0.45;
  const shineOpacity = Math.min(0.42, circleOpacity * 0.45);
  const shineOffset = radius * 0.35;
  const shineCenterColor = `rgba(255,255,255,${shineOpacity})`;
  const shineEdgeColor = 'rgba(255,255,255,0)';
  const insurrectGlowRadius = radius * 5;
  const insurrectGlowOpacity = Math.min(0.34, circleOpacity * 0.4);
  const insurrectPulseRadius = radius * 2.625;
  const insurrectGlowRef = useRef<Konva.Circle>(null);
  const insurrectPulseRef = useRef<Konva.Circle>(null);
  const systemCircleRef = useRef<Konva.Circle>(null);
  const pirateIconRef = useRef<Konva.Image>(null);
  const [pirateIconImage, setPirateIconImage] = useState<HTMLImageElement | null>(
    null
  );
  const pirateIconSize = radius * 2.4;

  useEffect(() => {
    if (!hasPirateRaid) return;
    if (pirateIconImageCache) {
      setPirateIconImage(pirateIconImageCache);
      return;
    }

    let cancelled = false;
    loadPirateIconImage()
      .then((image) => {
        if (!cancelled) setPirateIconImage(image);
      })
      .catch(() => {
        if (!cancelled) setPirateIconImage(null);
      });

    return () => {
      cancelled = true;
    };
  }, [hasPirateRaid]);

  useEffect(() => {
    if (!isInsurrect || !insurrectGlowRef.current || !insurrectPulseRef.current)
      return;

    const glowNode = insurrectGlowRef.current;
    const pulseNode = insurrectPulseRef.current;
    const pulseMaxOpacity = Math.min(0.525, circleOpacity * 0.675);

    const animation = new Konva.Animation((frame) => {
      if (!frame) return;
      const wave = (Math.sin(frame.time * 0.0055) + 1) / 2;
      const scale = 0.72 + wave * 1.18;
      const pulseOpacity = (0.225 + wave * 0.775) * pulseMaxOpacity;

      glowNode.opacity(0.4375 + wave * 0.5625);
      pulseNode.scale({ x: scale, y: scale });
      pulseNode.opacity(pulseOpacity);
    }, pulseNode.getLayer());

    animation.start();

    return () => {
      animation.stop();
      glowNode.opacity(0);
      pulseNode.scale({ x: 1, y: 1 });
      pulseNode.opacity(0);
    };
  }, [isInsurrect, circleOpacity]);

  useEffect(() => {
    if (!hasPirateRaid || !systemCircleRef.current) return;

    const systemNode = systemCircleRef.current;
    const pirateIconNode = pirateIconRef.current;

    const animation = new Konva.Animation((frame) => {
      if (!frame) return;
      const wave = (Math.sin(frame.time * 0.0055) + 1) / 2;
      const scale = 0.92 + wave * 0.655;

      systemNode.scale({ x: scale, y: scale });
      if (pirateIconNode) pirateIconNode.scale({ x: scale, y: scale });
    }, systemNode.getLayer());

    animation.start();

    return () => {
      animation.stop();
      systemNode.scale({ x: 1, y: 1 });
      if (pirateIconNode) pirateIconNode.scale({ x: 1, y: 1 });
    };
  }, [hasPirateRaid, pirateIconImage]);

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
    const ownerName =
      findFaction(system.owner, factions)?.prettyName || 'Unknown';
    const controlItems = buildControlItems(system.factions, factions);
    const topControl = controlItems.slice(0, 3);
    const remainingControlCount = Math.max(
      0,
      controlItems.length - topControl.length
    );
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
      {isInsurrect && (
        <Circle
          ref={insurrectGlowRef}
          x={centerX}
          y={centerY}
          radius={insurrectGlowRadius}
          fillRadialGradientStartPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndRadius={insurrectGlowRadius}
          fillRadialGradientColorStops={[
            0,
            `rgba(168,85,247,${Math.min(0.32, insurrectGlowOpacity + 0.03375)})`,
            0.6,
            `rgba(168,85,247,${insurrectGlowOpacity})`,
            1,
            'rgba(168,85,247,0)',
          ]}
          listening={false}
        />
      )}
      {isInsurrect && (
        <Circle
          ref={insurrectPulseRef}
          x={centerX}
          y={centerY}
          radius={insurrectPulseRadius}
          fillRadialGradientStartPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndRadius={insurrectPulseRadius}
          fillRadialGradientColorStops={[
            0,
            'rgba(192,132,252,0.7)',
            1,
            'rgba(192,132,252,0)',
          ]}
          listening={false}
        />
      )}
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
        ref={systemCircleRef}
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
      {hasPirateRaid && pirateIconImage && (
        <KonvaImage
          ref={pirateIconRef}
          image={pirateIconImage}
          x={centerX}
          y={centerY}
          width={pirateIconSize}
          height={pirateIconSize}
          offsetX={pirateIconSize / 2}
          offsetY={pirateIconSize / 2}
          listening={false}
        />
      )}
      {showActivePlayerIndicator && (
        <Circle
          x={centerX - shineOffset}
          y={centerY - shineOffset}
          radius={shineRadius}
          fillRadialGradientStartPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndRadius={shineRadius}
          fillRadialGradientColorStops={[
            0,
            shineCenterColor,
            1,
            shineEdgeColor,
          ]}
          listening={false}
        />
      )}
    </>
  );
};

export default memo(StarSystem);
