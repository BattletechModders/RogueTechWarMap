import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { usePinchZoom } from './usePinchZoom';
import type { Point } from '../GalaxyMap/gm.types';

type FakeStage = {
  scale: ReturnType<typeof vi.fn>;
  position: ReturnType<typeof vi.fn>;
  scaleX: ReturnType<typeof vi.fn>;
  getPosition: ReturnType<typeof vi.fn>;
};

const buildFakeStage = (): FakeStage => ({
  scale: vi.fn(),
  position: vi.fn(),
  scaleX: vi.fn(() => 1),
  getPosition: vi.fn(() => ({ x: 0, y: 0 })),
});

const renderPinch = (opts?: Partial<{ minScale: number; maxScale: number }>) => {
  const requestBatchDraw = vi.fn();
  const schedulePositionUpdate = vi.fn();
  const setZoomScaleFactor = vi.fn();
  const hideTooltip = vi.fn();
  const fakeStage = buildFakeStage();

  const hook = renderHook(() => {
    const stageRef = useRef<any>(fakeStage);
    const scaleRef = useRef<number>(1);
    const positionRef = useRef<Point>({ x: 0, y: 0 });
    return usePinchZoom({
      stageRef,
      scaleRef,
      positionRef,
      requestBatchDraw,
      schedulePositionUpdate,
      setZoomScaleFactor,
      hideTooltip,
      minScale: opts?.minScale,
      maxScale: opts?.maxScale,
    });
  });

  return { hook, fakeStage, requestBatchDraw, schedulePositionUpdate, setZoomScaleFactor, hideTooltip };
};

describe('usePinchZoom', () => {
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

  it('is not pinching initially and exposes three touch handlers', () => {
    const { hook } = renderPinch();
    expect(hook.result.current.isPinching).toBe(false);
    expect(typeof hook.result.current.handlers.onTouchStart).toBe('function');
    expect(typeof hook.result.current.handlers.onTouchMove).toBe('function');
    expect(typeof hook.result.current.handlers.onTouchEnd).toBe('function');
  });

  it('single tap on empty background calls hideTooltip', () => {
    const { hook, hideTooltip } = renderPinch();
    const evt = {
      evt: {
        touches: [{ clientX: 10, clientY: 10 }],
      },
      target: {
        className: 'Layer',
        findAncestor: () => undefined,
      },
    };

    act(() => {
      hook.result.current.handlers.onTouchStart(evt as any);
    });

    expect(hideTooltip).toHaveBeenCalled();
  });

  it('single tap on a Circle does not hide tooltip', () => {
    const { hook, hideTooltip } = renderPinch();
    const evt = {
      evt: { touches: [{ clientX: 0, clientY: 0 }] },
      target: {
        className: 'Circle',
        findAncestor: () => undefined,
      },
    };
    act(() => hook.result.current.handlers.onTouchStart(evt as any));
    expect(hideTooltip).not.toHaveBeenCalled();
  });

  it('two-finger touchStart turns on isPinching', () => {
    const { hook } = renderPinch();
    const evt = {
      evt: {
        touches: [
          { clientX: 0, clientY: 0 },
          { clientX: 10, clientY: 0 },
        ],
      },
      target: { className: 'Layer', findAncestor: () => undefined },
    };
    act(() => hook.result.current.handlers.onTouchStart(evt as any));
    expect(hook.result.current.isPinching).toBe(true);
  });

  it('touchEnd with < 2 touches resets isPinching to false', () => {
    const { hook, setZoomScaleFactor } = renderPinch();

    // start pinching
    act(() =>
      hook.result.current.handlers.onTouchStart({
        evt: {
          touches: [
            { clientX: 0, clientY: 0 },
            { clientX: 10, clientY: 0 },
          ],
        },
        target: { className: 'Layer', findAncestor: () => undefined },
      } as any)
    );
    expect(hook.result.current.isPinching).toBe(true);

    // end gesture
    act(() =>
      hook.result.current.handlers.onTouchEnd({
        evt: { touches: [] },
      } as any)
    );

    expect(hook.result.current.isPinching).toBe(false);
    expect(setZoomScaleFactor).toHaveBeenCalled();
  });

  it('onTouchMove is a no-op when not pinching', () => {
    const { hook, fakeStage } = renderPinch();

    act(() =>
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [
            { clientX: 0, clientY: 0 },
            { clientX: 20, clientY: 0 },
          ],
        },
      } as any)
    );

    expect(fakeStage.scale).not.toHaveBeenCalled();
  });

  it('onTouchMove calls schedulePositionUpdate so viewport culling stays current', () => {
    const { hook, schedulePositionUpdate } = renderPinch();

    // Start pinch with a baseline distance.
    act(() =>
      hook.result.current.handlers.onTouchStart({
        evt: {
          touches: [
            { clientX: 0, clientY: 0 },
            { clientX: 100, clientY: 0 },
          ],
        },
        target: { className: 'Layer', findAncestor: () => undefined },
      } as any)
    );

    // Move with a significantly different distance to pass the jitter guard.
    act(() =>
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [
            { clientX: 0, clientY: 0 },
            { clientX: 200, clientY: 0 },
          ],
        },
      } as any)
    );

    expect(schedulePositionUpdate).toHaveBeenCalled();
  });
});
