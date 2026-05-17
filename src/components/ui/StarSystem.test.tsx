import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import StarSystem from './StarSystem';
import type { DisplayStarSystemType, FactionDataType } from '../hooks/types';
import { initialSettings } from '../hooks/types';

// ---------------------------------------------------------------------------
// vi.hoisted — animation instance tracker available in vi.mock factories
// ---------------------------------------------------------------------------

const { animationInstances } = vi.hoisted(() => ({
  animationInstances: [] as Array<{ start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }>,
}));

// ---------------------------------------------------------------------------
// Module mocks (factories must be self-contained — no top-level imports)
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
          getStage: () => ({
            getPointerPosition: () => ({ x: 0, y: 0 }),
            getRelativePointerPosition: () => ({ x: 0, y: 0 }),
            x: () => 0,
            y: () => 0,
          }),
          batchDraw: vi.fn(),
          destroy: vi.fn(),
          container: vi.fn(() => ({ addEventListener: vi.fn(), removeEventListener: vi.fn() })),
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
    Circle: passthrough('span'),
    Group: passthrough('div'),
    Image: passthrough('div'),
  };
});

vi.mock('konva', () => {
  class Animation {
    start = vi.fn();
    stop = vi.fn();
    constructor() {
      animationInstances.push(this as any);
    }
  }
  class Text {
    width() { return 50; }
    destroy() {}
  }
  return { default: { Animation, Text }, __esModule: true };
});

// Asset imports resolve to empty strings in the test environment.
vi.mock('../../assets/joli-rouge-icon.svg', () => ({ default: '' }));
vi.mock('../../assets/shield.svg', () => ({ default: '' }));
vi.mock('../../assets/crosshairs.svg', () => ({ default: '' }));

vi.mock('../helpers', () => ({ openInNewTab: vi.fn() }));
vi.mock('../helpers/ApiHelper.ts', () => ({ API_BASE_URL: '' }));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeSystem = (overrides: Partial<DisplayStarSystemType> = {}): DisplayStarSystemType => ({
  id: 'terra',
  name: 'Terra',
  posX: 0,
  posY: 0,
  owner: 'ComStar',
  isCapital: false,
  factionColour: '#ffffff',
  factionName: 'ComStar',
  normalizedName: 'terra',
  factions: [],
  sysUrl: '/system/terra',
  state: {},
  ...overrides,
});

const fakeFactions: FactionDataType = {};

const baseProps = {
  factions: fakeFactions,
  scaleRef: { current: 1 } as React.RefObject<number>,
  registerScaleListener: vi.fn(() => vi.fn()),
  settings: initialSettings,
  showTooltip: vi.fn(),
  hideTooltip: vi.fn(),
  tooltipVisibleRef: { current: false } as React.MutableRefObject<boolean>,
  touchedSystemNameRef: { current: null } as React.MutableRefObject<string | null>,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StarSystem', () => {
  beforeEach(() => {
    animationInstances.length = 0;
    // Stub Image so icon loaders don't hang on missing URLs.
    vi.spyOn(window, 'Image' as any).mockImplementation(() => {
      const img: Partial<HTMLImageElement> = {};
      // Immediately invoke onload so the promise resolves synchronously.
      setTimeout(() => img.onload?.({} as Event), 0);
      return img as HTMLImageElement;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('renders without crashing for a plain system', () => {
    const { container } = render(
      React.createElement(StarSystem, { ...baseProps, system: makeSystem() })
    );
    expect(container).toBeTruthy();
  });

  it('starts a Konva.Animation when the system is in insurrection', () => {
    render(
      React.createElement(StarSystem, {
        ...baseProps,
        system: makeSystem({ state: { isInsurrect: true } }),
      })
    );
    expect(animationInstances.length).toBeGreaterThan(0);
    expect(animationInstances[0].start).toHaveBeenCalled();
  });

  it('stops the insurrection animation on unmount', () => {
    const { unmount } = render(
      React.createElement(StarSystem, {
        ...baseProps,
        system: makeSystem({ state: { isInsurrect: true } }),
      })
    );
    unmount();
    expect(animationInstances[0].stop).toHaveBeenCalled();
  });

  it('starts a size-pulse animation for a pirate raid system', () => {
    render(
      React.createElement(StarSystem, {
        ...baseProps,
        system: makeSystem({ state: { hasPirateRaid: true } }),
      })
    );
    expect(animationInstances.some((a) => a.start.mock.calls.length > 0)).toBe(true);
  });

  it('stops the size-pulse animation on unmount', () => {
    const { unmount } = render(
      React.createElement(StarSystem, {
        ...baseProps,
        system: makeSystem({ state: { hasPirateRaid: true } }),
      })
    );
    unmount();
    expect(animationInstances.every((a) => a.stop.mock.calls.length > 0)).toBe(true);
  });

  it('calls the registerScaleListener unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    const registerScaleListener = vi.fn(() => unsubscribe);

    const { unmount } = render(
      React.createElement(StarSystem, {
        ...baseProps,
        registerScaleListener,
        system: makeSystem(),
      })
    );
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
