import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { GalaxyMapRender } from './GalaxyMap';
import { initialSettings } from '../hooks/types';

// ---------------------------------------------------------------------------
// Module mocks — all factory functions must be self-contained (no top-level
// variable references) because vi.mock is hoisted before imports are resolved.
// ---------------------------------------------------------------------------

vi.mock('react-konva', () => {
  const passthrough = (tag: string) =>
    React.forwardRef<unknown, any>(function KonvaMock({ children, ...rest }: any, ref) {
      const fake = React.useMemo(
        () => ({
          opacity: vi.fn(),
          scale: vi.fn(),
          position: vi.fn(),
          getLayer: () => null,
          getStage: () => null,
          batchDraw: vi.fn(),
          destroy: vi.fn(),
          container: vi.fn(() => ({ addEventListener: vi.fn(), removeEventListener: vi.fn(), style: { touchAction: '' } })),
          getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
          getRelativePointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
          x: vi.fn(() => 0),
          y: vi.fn(() => 0),
          scaleX: vi.fn(() => 1),
          getPosition: vi.fn(() => ({ x: 0, y: 0 })),
        }),
        []
      );
      React.useImperativeHandle(ref, () => fake);
      const safeProps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          safeProps[`data-${k.toLowerCase()}`] = String(v);
        }
      }
      return React.createElement(tag, safeProps, children);
    });

  return {
    Stage: passthrough('div'),
    Layer: passthrough('div'),
    Image: passthrough('div'),
    Text: passthrough('span'),
    Group: passthrough('div'),
    Rect: passthrough('div'),
    Line: passthrough('span'),
  };
});

vi.mock('konva', () => {
  class Animation {
    constructor(public cb: (frame: unknown) => void, public layer: unknown) {}
    start() {}
    stop() {}
  }
  class Text {
    constructor(public opts: unknown) {}
    width() { return 50; }
    destroy() {}
  }
  return { default: { Animation, Text }, __esModule: true };
});

vi.mock('../hooks/useGalaxyViewport', () => ({
  useGalaxyViewport: () => ({
    stageRef: { current: null },
    scaleRef: { current: 1 },
    positionRef: { current: { x: 0, y: 0 } },
    view: { scale: 1, position: { x: 0, y: 0 } },
    schedulePositionUpdate: vi.fn(),
    setZoomScaleFactor: vi.fn(),
    registerScaleListener: vi.fn(() => vi.fn()),
    notifyScaleListeners: vi.fn(),
    handlers: { onWheel: vi.fn(), onDragMove: vi.fn() },
  }),
}));

vi.mock('../hooks/usePinchZoom', () => ({
  usePinchZoom: () => ({
    isPinching: false,
    handlers: {
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
    },
  }),
}));

vi.mock('../hooks/useTooltip', () => ({
  default: () => ({
    tooltip: { visible: false, x: 0, y: 0, text: '' },
    showTooltip: vi.fn(),
    hideTooltip: vi.fn(),
  }),
}));

vi.mock('../ui/StarSystem', () => ({ default: () => null }));
vi.mock('../ui/BottomFilterPanel', () => ({ default: () => null }));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const minimalProps = {
  systems: [],
  factions: {},
  settings: initialSettings,
};

// ---------------------------------------------------------------------------
// Helper — track which listeners a target registered vs removed.
// ---------------------------------------------------------------------------

type ListenerRecord = { event: string; handler: EventListener };

const collectListeners = (target: EventTarget) => {
  const added: ListenerRecord[] = [];
  const removed: ListenerRecord[] = [];

  vi.spyOn(target, 'addEventListener').mockImplementation((event, handler, ...rest) => {
    added.push({ event, handler: handler as EventListener });
    return (target.addEventListener as any).__original__?.(event, handler, ...rest);
  });

  vi.spyOn(target, 'removeEventListener').mockImplementation((event, handler, ...rest) => {
    removed.push({ event, handler: handler as EventListener });
    return (target.removeEventListener as any).__original__?.(event, handler, ...rest);
  });

  return { added, removed };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GalaxyMapRender — gesture listener cleanup', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 1;
    }) as typeof window.requestAnimationFrame);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes the gesture and touch document listeners it adds when unmounted', () => {
    const { added, removed } = collectListeners(document);

    const { unmount } = render(React.createElement(GalaxyMapRender, minimalProps));
    unmount();

    // Only assert cleanup for the events our component owns — React adds its own
    // internal document listeners (e.g. selectionchange) that it manages separately.
    const ours = ['touchmove', 'gesturestart', 'gesturechange', 'gestureend'];
    const ourAdded = added.filter((l) => ours.includes(l.event));
    expect(ourAdded.length).toBeGreaterThan(0);
    for (const { event, handler } of ourAdded) {
      const wasRemoved = removed.some((r) => r.event === event && r.handler === handler);
      expect(wasRemoved, `document listener "${event}" was not removed on unmount`).toBe(true);
    }
  });

  it('removes every window listener it adds when unmounted', () => {
    const { added, removed } = collectListeners(window);

    const { unmount } = render(React.createElement(GalaxyMapRender, minimalProps));
    unmount();

    expect(added.length).toBeGreaterThan(0);
    for (const { event, handler } of added) {
      const wasRemoved = removed.some((r) => r.event === event && r.handler === handler);
      expect(wasRemoved, `window listener "${event}" was not removed on unmount`).toBe(true);
    }
  });

  it('registers the expected document-level gesture and touch events', () => {
    const { added } = collectListeners(document);

    const { unmount } = render(React.createElement(GalaxyMapRender, minimalProps));
    unmount();

    const events = added.map((l) => l.event);
    expect(events).toContain('touchmove');
    expect(events).toContain('gesturestart');
    expect(events).toContain('gesturechange');
    expect(events).toContain('gestureend');
  });

  it('registers only the resize event at the window level', () => {
    const { added } = collectListeners(window);

    const { unmount } = render(React.createElement(GalaxyMapRender, minimalProps));
    unmount();

    const events = added.map((l) => l.event);
    expect(events).toContain('resize');
    // gesture* events are WebKit-only and already handled at the document level;
    // the redundant window-level gesture listeners were removed.
    expect(events).not.toContain('gesturestart');
    expect(events).not.toContain('gesturechange');
    expect(events).not.toContain('gestureend');
  });
});
