import {
  Point,
  StageSize,
  TooltipData,
  ViewTransform,
  GalaxyMapRenderProps,
} from '../GalaxyMap/gm.types';
import { buildFactionFilterOptions } from '../GalaxyMap/gm.selectors';
import { getDistance } from '../GalaxyMap/gm.interactions';
import { useMemo, useEffect, useState, useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image, Text, Label, Tag } from 'react-konva';
import StarSystem from '../ui/StarSystem';
import BottomFilterPanel from '../ui/BottomFilterPanel';
import useTooltip from '../hooks/useTooltip';
import useFiltering from '../hooks/useFiltering';

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

  const view: ViewTransform = {
    scale: scaleRef.current,
    position: positionRef.current,
  };

  const [stageSize, setStageSize] = useState<StageSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [zoomScaleFactor, setZoomScaleFactor] = useState<number>(1);

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

  const [isPinching, setIsPinching] = useState(false);
  const lastDistance = useRef(0);
  const pinchMidpoint = useRef<Point | null>(null);

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

  let frameRequested = false;
  const requestBatchDraw = (stage: Konva.Stage) => {
    if (!frameRequested) {
      frameRequested = true;
      requestAnimationFrame(() => {
        stage.batchDraw();
        frameRequested = false;
      });
    }
  };

  const lastWheelTime = useRef(0);
  const WHEEL_THROTTLE_MS = 50;

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    const now = performance.now();
    if (now - lastWheelTime.current < WHEEL_THROTTLE_MS) return;

    lastWheelTime.current = now;

    e.evt.preventDefault();
    const scaleBy = 1.25;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = scaleRef.current;
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    scaleRef.current = newScale;
    positionRef.current = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(positionRef.current);
    requestBatchDraw(stage);
    setZoomScaleFactor(scaleRef.current < 1 ? scaleRef.current : 1);
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    positionRef.current = { x: e.target.x(), y: e.target.y() };
  };

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length === 1) {
      const stage = e.target.getStage();
      if (!stage) return;
      const isCircle = e.target.className === 'Circle';
      const isTooltip = e.target.findAncestor('Label', true);
      if (!isCircle && !isTooltip) {
        hideTooltip();
      }
    }

    if (e.evt.touches.length === 2) {
      setIsPinching(true);
      lastDistance.current = getDistance(e.evt.touches[0], e.evt.touches[1]);

      pinchMidpoint.current = {
        x: (e.evt.touches[0].clientX + e.evt.touches[1].clientX) / 2,
        y: (e.evt.touches[0].clientY + e.evt.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length === 2 && isPinching) {
      e.evt.preventDefault();

      if (!pinchMidpoint.current) return;

      const [touch1, touch2] = e.evt.touches;
      const newDistance = getDistance(touch1, touch2);

      if (!lastDistance.current) return;

      const stage = stageRef.current;

      if (!stage) return;

      let scaleBy = newDistance / lastDistance.current;

      // Prevent jitter and dead zone on Firefox
      if (Math.abs(1 - scaleBy) < 0.02) return;

      // Clamp to avoid huge jumps
      scaleBy = Math.max(0.9, Math.min(1.1, scaleBy));

      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, scaleRef.current * scaleBy)
      );

      const stagePos = stage.getPosition();
      const stageScale = stage.scaleX();

      const pinchCenter = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      const worldPos = {
        x: (pinchCenter.x - stagePos.x) / stageScale,
        y: (pinchCenter.y - stagePos.y) / stageScale,
      };

      requestAnimationFrame(() => {
        const newPos = {
          x: pinchCenter.x - worldPos.x * newScale,
          y: pinchCenter.y - worldPos.y * newScale,
        };

        scaleRef.current = newScale;
        positionRef.current = newPos;

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
        requestBatchDraw(stage);
        setZoomScaleFactor(newScale < 1 ? newScale : 1); // mirror wheel zoom behavior
      });

      lastDistance.current = newDistance;
    }
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length < 2) {
      setIsPinching(false);
    }
  };

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
