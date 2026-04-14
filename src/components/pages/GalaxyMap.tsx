import {
  Point,
  TooltipData,
  ViewTransform,
  GalaxyMapRenderProps,
} from '../GalaxyMap/gm.types';
import { useMemo, useEffect, useState, useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image, Text, Label, Tag } from 'react-konva';
import StarSystem from '../ui/StarSystem';
import BottomFilterPanel from '../ui/BottomFilterPanel';
import useTooltip from '../hooks/useTooltip';
import useFiltering from '../hooks/useFiltering';
import usePreventBrowserZoom from '../hooks/usePreventBrowserZoom';
import useZoomPan from '../hooks/useZoomPan';
import usePinchZoom from '../hooks/usePinchZoom';

const GalaxyMap = () => {
  const {
    displaySystems,
    factions,
    capitals,
    fetchFactionData,
    fetchSystemData,
    settings,
  } = useFiltering();

  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!initialDataLoaded) {
      console.log('Loading data...');
      fetchFactionData();
      fetchSystemData();
      setInitialDataLoaded(true);
    }

    const interval = setInterval(() => {
      console.log('API Data Refreshing at', new Date().toLocaleTimeString());
      fetchSystemData();
    }, 300_000);

    return () => clearInterval(interval);
  }, [
    factions,
    capitals,
    fetchFactionData,
    fetchSystemData,
    initialDataLoaded,
  ]);

  if (
    displaySystems &&
    displaySystems.length > 0 &&
    factions &&
    capitals &&
    capitals.length > 0
  ) {
    return (
      <GalaxyMapRender
        systems={displaySystems}
        factions={factions}
        settings={settings}
      />
    );
  }

  return null;
};

const GalaxyMapRender = ({
  systems,
  factions,
  settings,
}: GalaxyMapRenderProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const shouldFilter = normalizedSearch.length >= 2;

  /* faction filter */
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);

  const scaleRef = useRef(1);
  const { tooltip, showTooltip, hideTooltip } = useTooltip(scaleRef) as {
    tooltip: TooltipData;
    showTooltip: (...args: any[]) => void;
    hideTooltip: () => void;
  };
  const stageRef = useRef<Konva.Stage | null>(null);
  const positionRef = useRef<Point>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const [zoomScaleFactor, setZoomScaleFactor] = useState<number>(1);

  const { stageSize } = usePreventBrowserZoom(stageRef);
  const { handleWheel, handleDragMove } = useZoomPan(
    stageRef,
    scaleRef,
    positionRef,
    setZoomScaleFactor
  );
  const { isPinching, handleTouchStart, handleTouchMove, handleTouchEnd } =
    usePinchZoom(stageRef, scaleRef, positionRef, hideTooltip, setZoomScaleFactor);

  const view: ViewTransform = {
    scale: scaleRef.current,
    position: positionRef.current,
  };

  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const img = new window.Image();

    const isFirefox =
      typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);

    const imagePath = isFirefox
      ? 'galaxyBackground2.webp'
      : 'galaxyBackground2.svg';

    img.src = import.meta.env.BASE_URL + imagePath;
    img.onload = () => {
      setBackground(img);
      setBgLoaded(true);
    };
  }, []);

  const isMobile = window.innerWidth < 768;
  const tooltipScale = isMobile ? 1.5 / view.scale : 2 / view.scale;

  return (
    <>
      {/* Konva Stage */}

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        draggable={!isPinching}
        scaleX={view.scale}
        scaleY={view.scale}
        x={view.position.x}
        y={view.position.y}
        ref={stageRef}
        onWheel={handleWheel}
        onDragMove={handleDragMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Layer cache>
          {bgLoaded && background ? (
            <Image
              image={background}
              x={-4800}
              y={-2700}
              width={9600}
              height={5400}
              opacity={0.2}
            />
          ) : (
            <Text
              text="Loading Background..."
              x={window.innerWidth / 2}
              y={window.innerHeight / 2}
              fontSize={24}
              fill="white"
              align="center"
            />
          )}
        </Layer>
        <Layer>
          {systems.map((system, index) => {
            /* resolve owner's display name the same way allFactionNames() did */
            const ownerPretty =
              factions[system.owner]?.prettyName ?? system.owner;
            const factionMatch =
              !selectedFactions.length ||
              selectedFactions.includes(ownerPretty);
            if (!factionMatch) return null;

            const isMatch = system.name
              .toLowerCase()
              .includes(normalizedSearch);
            const opacity = shouldFilter ? (isMatch ? 1 : 0.2) : 1;
            return (
              <StarSystem
                key={system.name || index}
                zoomScaleFactor={zoomScaleFactor}
                system={system}
                factions={factions}
                settings={settings}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
                tooltip={tooltip}
                highlighted={shouldFilter && isMatch}
                opacity={opacity}
              />
            );
          })}
        </Layer>
        <Layer>
          {tooltip.visible && (
            <Label
              x={tooltip.x}
              y={tooltip.y}
              opacity={0.75}
              scaleX={tooltipScale}
              scaleY={tooltipScale}
              onTouchStart={(e) => {
                e.evt.preventDefault();
                if (tooltip.onTouch) {
                  tooltip.onTouch();
                }
              }}
            >
              <Tag
                fill="white"
                pointerDirection="down"
                pointerWidth={10}
                pointerHeight={10}
                shadowColor="gray"
                shadowBlur={10}
                shadowOffset={{ x: 10, y: 10 }}
                shadowOpacity={0.2}
                cornerRadius={8}
              />
              <Text
                text={tooltip.text}
                fontFamily="Roboto Mono, monospace"
                fontSize={
                  parseFloat(
                    getComputedStyle(document.documentElement).fontSize
                  ) * 0.85
                }
                padding={5}
                fill="black"
              />
            </Label>
          )}
        </Layer>
      </Stage>
      {/* bottom sliding filter panel */}
      <BottomFilterPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        factions={useMemo(() => {
          const names = new Set<string>();
          for (const system of systems) {
            const owner = system.owner;
            const pretty = factions[owner]?.prettyName ?? owner;
            if (pretty) names.add(pretty);
          }
          return Array.from(names).sort((a, b) => a.localeCompare(b));
        }, [systems, factions])}
        selectedFactions={selectedFactions}
        setSelectedFactions={setSelectedFactions}
      />
    </>
  );
};

export const Map = GalaxyMap;
export default GalaxyMap;
