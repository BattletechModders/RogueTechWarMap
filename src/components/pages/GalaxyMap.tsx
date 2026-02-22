import {
  StageSize,
  TooltipData,
  GalaxyMapRenderProps,
} from '../GalaxyMap/gm.types';
import { buildFactionFilterOptions } from '../GalaxyMap/gm.selectors';
import { useMemo, useEffect, useState } from 'react';
import { Stage, Layer, Image, Text, Label, Tag } from 'react-konva';
import StarSystem from '../ui/StarSystem';
import BottomFilterPanel from '../ui/BottomFilterPanel';
import useTooltip from '../hooks/useTooltip';
import useFiltering from '../hooks/useFiltering';
import { useGalaxyViewport } from '../hooks/useGalaxyViewport';
import { usePinchZoom } from '../hooks/usePinchZoom';

const MIN_SCALE = 0.2;
const MAX_SCALE = 25;

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
  const {
    stageRef,
    scaleRef,
    positionRef,
    view,
    zoomScaleFactor,
    requestBatchDraw,
    setZoomScaleFactor,
    handlers: { onWheel, onDragMove },
  } = useGalaxyViewport();
  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const shouldFilter = normalizedSearch.length >= 2;

  /* faction filter */
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);

  const { tooltip, showTooltip, hideTooltip } = useTooltip(scaleRef) as {
    tooltip: TooltipData;
    showTooltip: (...args: any[]) => void;
    hideTooltip: () => void;
  };

  const {
    isPinching,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  } = usePinchZoom({
    stageRef,
    scaleRef,
    positionRef,
    requestBatchDraw,
    setZoomScaleFactor,
    hideTooltip,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  });

  const [stageSize, setStageSize] = useState<StageSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Block Firefox pinch-to-zoom at document level
  useEffect(() => {
    const preventZoomTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventZoomGesture: EventListener = (e) => {
      e.preventDefault();
    };

    const options = { passive: false } as AddEventListenerOptions;

    document.addEventListener('touchmove', preventZoomTouch, options);
    document.addEventListener('gesturestart', preventZoomGesture, options);
    document.addEventListener('gesturechange', preventZoomGesture, options);
    document.addEventListener('gestureend', preventZoomGesture, options);

    return () => {
      document.removeEventListener('touchmove', preventZoomTouch, options);
      document.removeEventListener('gesturestart', preventZoomGesture, options);
      document.removeEventListener(
        'gesturechange',
        preventZoomGesture,
        options
      );
      document.removeEventListener('gestureend', preventZoomGesture, options);
    };
  }, []);

  // extra locking gesture handling for Firefox
  useEffect(() => {
    const lockScale = (e: Event) => e.preventDefault();

    window.addEventListener('gesturestart', lockScale, { passive: false });
    window.addEventListener('gesturechange', lockScale, { passive: false });
    window.addEventListener('gestureend', lockScale, { passive: false });

    return () => {
      window.removeEventListener('gesturestart', lockScale);
      window.removeEventListener('gesturechange', lockScale);
      window.removeEventListener('gestureend', lockScale);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const container = stage.container();
    const preventDefault = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };

    container.addEventListener('gesturestart', preventDefault, {
      passive: false,
    });
    container.addEventListener('gesturechange', preventDefault, {
      passive: false,
    });
    container.addEventListener('gestureend', preventDefault, {
      passive: false,
    });
    container.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      container.removeEventListener('gesturestart', preventDefault);
      container.removeEventListener('gesturechange', preventDefault);
      container.removeEventListener('gestureend', preventDefault);
      container.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  const isMobile = window.innerWidth < 768;
  const tooltipScale = isMobile ? 1.5 / view.scale : 2 / view.scale;
  const tooltipFontSize =
    parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.85;
  const mobileTooltipData = useMemo(() => {
    const trimmed = tooltip.text?.trim();
    if (!trimmed) {
      return { title: '', subtitle: '', details: [] as string[] };
    }

    const lines = trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && line !== '[Tap to open]');

    const title = lines[0] ?? '';
    const subtitle = lines[1]?.startsWith('(') ? lines[1] : '';
    const details = lines.slice(subtitle ? 2 : 1);

    return { title, subtitle, details };
  }, [tooltip.text]);

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
        onWheel={onWheel}
        onDragMove={onDragMove}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
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
            /* resolve owner’s display name the same way allFactionNames() did */
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
                zoomScaleFactor={zoomScaleFactor < 1 ? zoomScaleFactor : 1}
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
          {tooltip.visible && !isMobile && (
              <Label
                x={tooltip.x}
                y={tooltip.y}
                opacity={0.75}
                scaleX={tooltipScale}
                scaleY={tooltipScale}
                onTouchStart={(e) => {
                  e.evt.preventDefault();
                  tooltip.onTouch?.();
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
                  fontSize={tooltipFontSize}
                  padding={5}
                  fill="black"
                />
              </Label>
          )}
        </Layer>
      </Stage>
      {isMobile && tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: '12px',
            right: '12px',
            bottom: 'calc(84px + env(safe-area-inset-bottom))',
            maxHeight: '45vh',
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.94)',
            color: '#111',
            borderRadius: '14px',
            padding: '12px 14px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.28)',
            zIndex: 30,
            fontFamily: 'Roboto Mono, monospace',
          }}
        >
          <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            {mobileTooltipData.title}
          </div>
          {mobileTooltipData.subtitle && (
            <div style={{ marginTop: '2px', opacity: 0.8 }}>
              {mobileTooltipData.subtitle}
            </div>
          )}
          <div style={{ marginTop: '8px', display: 'grid', rowGap: '4px' }}>
            {mobileTooltipData.details.map((detail, index) => (
              <div key={`${detail}-${index}`}>{detail}</div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
            }}
          >
            {tooltip.onTouch && (
              <button
                type="button"
                onClick={() => tooltip.onTouch?.()}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  background: '#111',
                  color: '#fff',
                }}
              >
                Open System
              </button>
            )}
            <button
              type="button"
              onClick={hideTooltip}
              style={{
                border: '1px solid #999',
                borderRadius: '8px',
                padding: '8px 12px',
                background: 'transparent',
                color: '#111',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* bottom sliding filter panel */}
      <BottomFilterPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        factions={useMemo(
          () => buildFactionFilterOptions(systems, factions),
          [systems, factions]
        )}
        selectedFactions={selectedFactions}
        setSelectedFactions={setSelectedFactions}
      />
    </>
  );
};

export const Map = GalaxyMap;
export default GalaxyMap;
