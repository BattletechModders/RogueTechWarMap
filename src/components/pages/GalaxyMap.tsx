import {
  StageSize,
  GalaxyMapRenderProps,
  ViewTransform,
} from '../GalaxyMap/gm.types';
import { buildFactionFilterOptions } from '../GalaxyMap/gm.selectors';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Stage, Layer, Image, Text, Group, Rect, Line } from 'react-konva';
import StarSystem from '../ui/StarSystem';
import BottomFilterPanel from '../ui/BottomFilterPanel';
import useTooltip from '../hooks/useTooltip';
import useFiltering from '../hooks/useFiltering';
import { useGalaxyViewport } from '../hooks/useGalaxyViewport';
import { usePinchZoom } from '../hooks/usePinchZoom';

const MIN_SCALE = 0.2;
const MAX_SCALE = 25;
const TOOLTIP_FONT_FAMILY = 'Roboto Mono, monospace';
const tooltipMeasureContext =
  typeof document !== 'undefined'
    ? document.createElement('canvas').getContext('2d')
    : null;

const getViewportSize = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const getTooltipFontSize = () => {
  if (typeof document === 'undefined') {
    return 16 * 0.85;
  }

  return parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.85;
};

const measureTooltipTextWidth = (
  text: string,
  fontSize: number,
  fontStyle: 'bold' | 'normal'
) => {
  if (!tooltipMeasureContext) {
    return text.length * fontSize * 0.6;
  }

  tooltipMeasureContext.font = `${fontStyle} ${fontSize}px ${TOOLTIP_FONT_FAMILY}`;
  return tooltipMeasureContext.measureText(text).width;
};

const GalaxyMap = () => {
  const {
    displaySystems,
    factions,
    capitals,
    fetchFactionData,
    fetchSystemData,
    settings,
  } = useFiltering();

  const fetchFactionDataRef = useRef(fetchFactionData);
  const fetchSystemDataRef = useRef(fetchSystemData);

  useEffect(() => {
    fetchFactionDataRef.current = fetchFactionData;
    fetchSystemDataRef.current = fetchSystemData;
  }, [fetchFactionData, fetchSystemData]);

  useEffect(() => {
    fetchFactionDataRef.current();
    fetchSystemDataRef.current();

    const interval = setInterval(() => {
      fetchSystemDataRef.current();
    }, 300_000);

    return () => clearInterval(interval);
  }, []);

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
    requestBatchDraw,
    setZoomScaleFactor,
    handlers: { onWheel, onDragMove },
  } = useGalaxyViewport();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [showAllControl, setShowAllControl] = useState(false);
  const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
  const shouldFilter = normalizedSearch.length >= 2;

  /* Empty means "all factions"; when populated, only matching owners are rendered. */
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);

  const { tooltip, showTooltip, hideTooltip } = useTooltip(scaleRef);
  const tooltipVisibleRef = useRef(false);
  const touchedSystemNameRef = useRef<string | null>(null);

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

  const [stageSize, setStageSize] = useState<StageSize>(getViewportSize());

  // Block native Firefox pinch zoom at the document level so the custom map handler stays in control.
  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

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

  // Keep an additional window-level gesture lock for Firefox variants that skip document events.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

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
    if (typeof window === 'undefined') {
      return undefined;
    }

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
  const [bgLoadError, setBgLoadError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

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

    img.onerror = () => {
      setBgLoadError(true);
      setBgLoaded(true);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (typeof stage.container !== 'function') return;

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

  const isMobile = stageSize.width > 0 && stageSize.width < 768;
  const tooltipScale = isMobile ? 1.5 / view.scale : 2 / view.scale;
  const tooltipFontSize = getTooltipFontSize();
  const desktopTooltipPadding = 6;
  const factionOptions = useMemo(
    () => buildFactionFilterOptions(systems, factions),
    [systems, factions]
  );

  const getViewportBounds = (
    stageSize: StageSize,
    view: ViewTransform,
    screenMargin = 120
  ) => {
    if (stageSize.width <= 0 || stageSize.height <= 0) {
      return {
        left: Number.NEGATIVE_INFINITY,
        right: Number.POSITIVE_INFINITY,
        top: Number.NEGATIVE_INFINITY,
        bottom: Number.POSITIVE_INFINITY,
      };
    }

    const margin = Math.max(screenMargin / view.scale, 1);
    const left = (0 - view.position.x) / view.scale - margin;
    const top = (0 - view.position.y) / view.scale - margin;
    const right = (stageSize.width - view.position.x) / view.scale + margin;
    const bottom = (stageSize.height - view.position.y) / view.scale + margin;

    return { left, right, top, bottom };
  };

  const visibleSystems = useMemo(() => {
    const viewport = getViewportBounds(stageSize, view, 120);
    const selectedFactionsSet = new Set(selectedFactions);

    return systems.filter((system) => {
      const x = Number(system.posX);
      const y = -Number(system.posY);

      if (
        x < viewport.left ||
        x > viewport.right ||
        y < viewport.top ||
        y > viewport.bottom
      ) {
        return false;
      }

      return (
        !selectedFactionsSet.size ||
        selectedFactionsSet.has(system.factionName)
      );
    });
  }, [selectedFactions, stageSize, systems, view]);
  const desktopPointerHeight = 10;
  const desktopPointerWidth = 12;
  const desktopTitleFontSize = tooltipFontSize * 1.12;
  const desktopBodyFontSize = tooltipFontSize * 0.92;
  const desktopLineHeight = desktopTitleFontSize * 1.2;

  const renderedSystems = useMemo(
    () =>
      visibleSystems.map((system) => {
        const isMatch =
          !shouldFilter || system.normalizedName.includes(normalizedSearch);
        const opacity = shouldFilter ? (isMatch ? 1 : 0.2) : 1;

        return (
          <StarSystem
            key={system.id}
            scaleRef={scaleRef}
            system={system}
            factions={factions}
            settings={settings}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
            tooltipVisibleRef={tooltipVisibleRef}
            touchedSystemNameRef={touchedSystemNameRef}
            highlighted={shouldFilter && isMatch}
            opacity={opacity}
          />
        );
      }),
    [
      factions,
      hideTooltip,
      normalizedSearch,
      scaleRef,
      settings,
      shouldFilter,
      showTooltip,
      visibleSystems,
    ]
  );

  const getDesktopLineSegments = useCallback((line: string, index: number) => {
    if (index === 0) {
      return [
        {
          text: line,
          fontStyle: 'bold' as const,
          fontSize: desktopTitleFontSize,
        },
      ];
    }

    const match = line.match(/^(Owner:|Damage:)\s*(.*)$/);
    if (match) {
      const [, label, value] = match;
      return [
        {
          text: `${label} `,
          fontStyle: 'bold' as const,
          fontSize: desktopBodyFontSize,
        },
        {
          text: value,
          fontStyle: 'normal' as const,
          fontSize: desktopBodyFontSize,
        },
      ];
    }

    return [
      {
        text: line,
        fontStyle: /^(Control|State):/.test(line)
          ? ('bold' as const)
          : ('normal' as const),
        fontSize: desktopBodyFontSize,
      },
    ];
  }, [desktopTitleFontSize, desktopBodyFontSize]);

  const desktopTooltipLines = useMemo(
    () => (tooltip.text || '').split('\n').map((line) => line.trimEnd()),
    [tooltip.text]
  );

  const desktopTooltipLayout = useMemo(() => {
    const lines = desktopTooltipLines.length ? desktopTooltipLines : [''];
    const widths = lines.map((line, index) =>
      getDesktopLineSegments(line, index).reduce((sum, segment) => {
        return (
          sum +
          measureTooltipTextWidth(
            segment.text,
            segment.fontSize,
            segment.fontStyle
          )
        );
      }, 0)
    );

    const contentWidth = widths.length ? Math.max(...widths) : 0;
    const boxWidth = contentWidth + desktopTooltipPadding * 2;
    const boxHeight =
      lines.length * desktopLineHeight + desktopTooltipPadding * 2;
    return { lines, boxWidth, boxHeight };
  }, [desktopTooltipLines, desktopLineHeight, getDesktopLineSegments]);

  useEffect(() => {
    if (tooltip.visible) {
      setShowAllControl(false);
    }
  }, [tooltip.visible, tooltip.text]);

  useEffect(() => {
    tooltipVisibleRef.current = tooltip.visible;
    if (!tooltip.visible) {
      touchedSystemNameRef.current = null;
    }
  }, [tooltip.visible]);

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
    const rawDetails = lines.slice(subtitle ? 2 : 1);

    // Control lines are rendered separately via tooltip.controlItems — keep only
    // the known labelled fields so faction percentage lines are never silently dropped.
    const DETAIL_PREFIXES = ['Owner:', 'Damage:', 'State:'];
    const details = rawDetails.filter((line) =>
      DETAIL_PREFIXES.some((prefix) => line.startsWith(prefix))
    );

    return { title, subtitle, details };
  }, [tooltip.text]);

  const controlItems = useMemo(
    () =>
      [...(tooltip.controlItems || [])].sort((a, b) => b.control - a.control),
    [tooltip.controlItems]
  );
  const visibleControlItems = showAllControl
    ? controlItems
    : controlItems.slice(0, 3);
  const hiddenControlCount = Math.max(0, controlItems.length - 3);

  return (
    <>
      {/* Render interactive map stage and layers using React-Konva. */}

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
          {bgLoaded && background && !bgLoadError ? (
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
              text={
                bgLoadError ? 'Background unavailable' : 'Loading Background...'
              }
              x={stageSize.width / 2}
              y={stageSize.height / 2}
              fontSize={24}
              fill="white"
              align="center"
            />
          )}
        </Layer>
        <Layer>
          {renderedSystems}
        </Layer>
        <Layer>
          {tooltip.visible && !isMobile && (
            <Group
              x={tooltip.x}
              y={tooltip.y}
              opacity={0.75}
              scaleX={tooltipScale}
              scaleY={tooltipScale}
            >
              <Rect
                x={-desktopTooltipLayout.boxWidth / 2}
                y={-(desktopTooltipLayout.boxHeight + desktopPointerHeight)}
                width={desktopTooltipLayout.boxWidth}
                height={desktopTooltipLayout.boxHeight}
                fill="white"
                cornerRadius={8}
                shadowColor="gray"
                shadowBlur={10}
                shadowOffset={{ x: 10, y: 10 }}
                shadowOpacity={0.2}
              />
              <Line
                points={[
                  -desktopPointerWidth / 2,
                  -desktopPointerHeight,
                  0,
                  0,
                  desktopPointerWidth / 2,
                  -desktopPointerHeight,
                ]}
                fill="white"
                closed
              />
              {desktopTooltipLayout.lines.map((line, index) =>
                (() => {
                  const segments = getDesktopLineSegments(line, index);
                  return (
                    <Group
                      key={`${line}-${index}`}
                      x={
                        -desktopTooltipLayout.boxWidth / 2 +
                        desktopTooltipPadding
                      }
                      y={
                        -(
                          desktopTooltipLayout.boxHeight +
                          desktopPointerHeight -
                          desktopTooltipPadding -
                          index * desktopLineHeight
                        )
                      }
                      listening={false}
                    >
                      {segments.map((segment, segmentIndex) => {
                        const segmentOffset = segments
                          .slice(0, segmentIndex)
                          .reduce((sum, previousSegment) => {
                            return (
                              sum +
                              measureTooltipTextWidth(
                                previousSegment.text,
                                previousSegment.fontSize,
                                previousSegment.fontStyle
                              )
                            );
                          }, 0);

                        return (
                          <Text
                            key={`${segment.text}-${segmentIndex}`}
                            x={segmentOffset}
                            y={0}
                            text={segment.text}
                            fontFamily={TOOLTIP_FONT_FAMILY}
                            fontSize={segment.fontSize}
                            fontStyle={segment.fontStyle}
                            fill="black"
                            listening={false}
                          />
                        );
                      })}
                    </Group>
                  );
                })()
              )}
            </Group>
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
          {controlItems.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                Control
              </div>
              <div style={{ display: 'grid', rowGap: '2px' }}>
                {visibleControlItems.map((item) => (
                  <div
                    key={`${item.name}-${item.control}-${item.players}`}
                  >{`${item.name} ${item.control}% · P${item.players}`}</div>
                ))}
              </div>
              {hiddenControlCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllControl((prev) => !prev)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#1f2937',
                    textDecoration: 'underline',
                    padding: 0,
                    marginTop: '4px',
                  }}
                >
                  {showAllControl
                    ? 'Show less'
                    : `Show all (${hiddenControlCount} more)`}
                </button>
              )}
            </div>
          )}
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
      {/* Render slide-up filters that control search and faction matching. */}
      <BottomFilterPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        factions={factionOptions}
        selectedFactions={selectedFactions}
        setSelectedFactions={setSelectedFactions}
      />
    </>
  );
};

export const Map = GalaxyMap;
export default GalaxyMap;
