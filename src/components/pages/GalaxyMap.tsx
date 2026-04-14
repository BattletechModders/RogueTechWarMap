import {
  Point,
  ViewTransform,
  GalaxyMapRenderProps,
} from '../GalaxyMap/gm.types';
import { useMemo, useEffect, useState, useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image, Text, Label, Tag } from 'react-konva';
import StarSystem from '../ui/StarSystem';
import BottomFilterPanel from '../ui/BottomFilterPanel';
import useTooltip, { type UseTooltipReturn } from '../hooks/useTooltip';
import useFiltering from '../hooks/useFiltering';
import usePreventBrowserZoom from '../hooks/usePreventBrowserZoom';
import useZoomPan from '../hooks/useZoomPan';
import usePinchZoom from '../hooks/usePinchZoom';
import {
  DESKTOP_BREAKPOINT,
  BG_IMAGE_X,
  BG_IMAGE_Y,
  BG_IMAGE_WIDTH,
  BG_IMAGE_HEIGHT,
} from '../constants';

const GalaxyMap = () => {
  const {
    displaySystems,
    factions,
    capitals,
    fetchFactionData,
    fetchSystemData,
    settings,
    isLoading,
    error,
  } = useFiltering();

  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!initialDataLoaded) {
      fetchFactionData();
      fetchSystemData();
      setInitialDataLoaded(true);
    }

    const interval = setInterval(() => {
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

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#1a1a2e',
          color: '#e0e0e0',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Failed to load map data
        </h1>
        <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>{error}</p>
        <button
          onClick={() => {
            fetchFactionData();
            fetchSystemData();
          }}
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: '#4a90d9',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (
    isLoading ||
    !displaySystems ||
    displaySystems.length === 0 ||
    !factions ||
    !capitals ||
    capitals.length === 0
  ) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#1a1a2e',
          color: '#e0e0e0',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#4a90d9',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: '1rem', opacity: 0.8 }}>Loading map data...</p>
      </div>
    );
  }

  return (
    <GalaxyMapRender
      systems={displaySystems}
      factions={factions}
      settings={settings}
    />
  );
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
  const { tooltip, showTooltip, hideTooltip }: UseTooltipReturn = useTooltip(scaleRef);
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

  const isMobile = window.innerWidth < DESKTOP_BREAKPOINT;
  const tooltipScale = isMobile ? 1.5 / view.scale : 2 / view.scale;

  return (
    <>
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
              x={BG_IMAGE_X}
              y={BG_IMAGE_Y}
              width={BG_IMAGE_WIDTH}
              height={BG_IMAGE_HEIGHT}
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
