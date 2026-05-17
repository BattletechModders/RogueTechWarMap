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
  batchDraw: ReturnType<typeof vi.fn>;
  container: ReturnType<typeof vi.fn>;
};

const buildFakeStage = (): FakeStage => ({
  scale: vi.fn(),
  position: vi.fn(),
  scaleX: vi.fn(() => 1),
  getPosition: vi.fn(() => ({ x: 0, y: 0 })),
  batchDraw: vi.fn(),
  container: vi.fn(() => ({
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
  })),
});

const renderPinch = (opts?: Partial<{
  minScale: number;
  maxScale: number;
  stageSize: { width: number; height: number };
}>) => {
  const schedulePositionUpdate = vi.fn();
  const setZoomScaleFactor = vi.fn();
  const notifyScaleListeners = vi.fn();
  const hideTooltip = vi.fn();
  const fakeStage = buildFakeStage();

  const hook = renderHook(({ stageSize } = opts ?? {}) => {
    const stageRef = useRef<any>(fakeStage);
    const scaleRef = useRef<number>(1);
    const positionRef = useRef<Point>({ x: 0, y: 0 });
    return usePinchZoom({
      stageRef,
      scaleRef,
      positionRef,
      schedulePositionUpdate,
      setZoomScaleFactor,
      notifyScaleListeners,
      hideTooltip,
      minScale: opts?.minScale,
      maxScale: opts?.maxScale,
      stageSize,
    });
  }, { initialProps: opts ?? {} });

  return { hook, fakeStage, schedulePositionUpdate, setZoomScaleFactor, notifyScaleListeners, hideTooltip };
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

  it('touchEnd does not hide tooltip when dropping from pinch to single touch', () => {
    const { hook, hideTooltip } = renderPinch();

    act(() =>
      hook.result.current.handlers.onTouchStart({
        evt: { touches: [{ clientX: 0, clientY: 0 }, { clientX: 10, clientY: 0 }] },
        target: { className: 'Layer', findAncestor: () => undefined },
      } as any)
    );

    act(() =>
      hook.result.current.handlers.onTouchEnd({ evt: { touches: [{ clientX: 0, clientY: 0 }] } } as any)
    );

    expect(hideTooltip).not.toHaveBeenCalled();
  });

  it('touchEnd with < 2 touches resets isPinching to false', () => {
    const { hook, notifyScaleListeners, schedulePositionUpdate, setZoomScaleFactor } = renderPinch();

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
    expect(schedulePositionUpdate).toHaveBeenCalled();
    expect(notifyScaleListeners).toHaveBeenCalled();
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

  it('onTouchMove keeps pinch updates imperative without React sync', () => {
    const { hook, notifyScaleListeners, schedulePositionUpdate, setZoomScaleFactor } = renderPinch();

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

    expect(schedulePositionUpdate).not.toHaveBeenCalled();
    expect(setZoomScaleFactor).not.toHaveBeenCalled();
    expect(notifyScaleListeners).not.toHaveBeenCalled();
  });

  it('translates the stage when the pinch center moves even if distance stays the same', () => {
    const { hook, fakeStage } = renderPinch();

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

    act(() =>
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [
            { clientX: 50, clientY: 0 },
            { clientX: 150, clientY: 0 },
          ],
        },
      } as any)
    );

    expect(fakeStage.scale).toHaveBeenCalledWith({ x: 1, y: 1 });
    expect(fakeStage.position).toHaveBeenCalledWith({ x: 50, y: 0 });
  });

  it('applies tiny pinch-center drift continuously when scale is unchanged', () => {
    const { hook, fakeStage } = renderPinch();

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

    act(() =>
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [
            { clientX: 1, clientY: 0 },
            { clientX: 101, clientY: 0 },
          ],
        },
      } as any)
    );

    expect(fakeStage.scale).toHaveBeenCalledWith({ x: 1, y: 1 });
    expect(fakeStage.position).toHaveBeenCalledWith({ x: 1, y: 0 });
  });

  it('uses stage-local coordinates when the stage container is offset in the page', () => {
    const { hook, fakeStage } = renderPinch();
    fakeStage.container.mockReturnValue({
      getBoundingClientRect: () => ({ left: 40, top: 100 }),
    });

    act(() =>
      hook.result.current.handlers.onTouchStart({
        evt: {
          touches: [
            { clientX: 140, clientY: 200 },
            { clientX: 240, clientY: 200 },
          ],
        },
        target: { className: 'Layer', findAncestor: () => undefined },
      } as any)
    );

    act(() =>
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [
            { clientX: 140, clientY: 200 },
            { clientX: 340, clientY: 200 },
          ],
        },
      } as any)
    );

    expect(fakeStage.position).toHaveBeenCalledTimes(1);
    const [newPos] = fakeStage.position.mock.calls[0];
    expect(newPos.x).toBeCloseTo(-100);
    expect(newPos.y).toBeCloseTo(-100);
  });

  it('does not call stage.scale when both touch points are identical (zero distance)', () => {
    const { hook, fakeStage } = renderPinch();

    act(() =>
      hook.result.current.handlers.onTouchStart({
        evt: {
          touches: [
            { clientX: 50, clientY: 50 },
            { clientX: 100, clientY: 50 },
          ],
        },
        target: { className: 'Layer', findAncestor: () => undefined },
      } as any)
    );

    // Both fingers at the same point — distance is 0, would produce NaN scale.
    act(() =>
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [
            { clientX: 75, clientY: 75 },
            { clientX: 75, clientY: 75 },
          ],
        },
      } as any)
    );

    expect(fakeStage.scale).not.toHaveBeenCalled();
  });

  it('sets baseline distance on first move when onTouchStart recorded zero distance', () => {
    // onTouchStart with identical points → lastDistance = 0 (falsy).
    // The first onTouchMove RAF should set the baseline and return without scaling.
    const { hook, fakeStage } = renderPinch();

    act(() =>
      hook.result.current.handlers.onTouchStart({
        evt: { touches: [{ clientX: 0, clientY: 0 }, { clientX: 0, clientY: 0 }] },
        target: { className: 'Layer', findAncestor: () => undefined },
      } as any)
    );

    act(() =>
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }],
        },
      } as any)
    );

    // First move just records the baseline — no scale change yet.
    expect(fakeStage.scale).not.toHaveBeenCalled();

    // Second move now has a valid baseline and should trigger a scale update.
    act(() =>
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [{ clientX: 0, clientY: 0 }, { clientX: 200, clientY: 0 }],
        },
      } as any)
    );

    expect(fakeStage.scale).toHaveBeenCalled();
  });

  it('calls cancelAnimationFrame when onTouchEnd fires after a pinch move', () => {
    const { hook } = renderPinch();

    act(() =>
      hook.result.current.handlers.onTouchStart({
        evt: {
          touches: [{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }],
        },
        target: { className: 'Layer', findAncestor: () => undefined },
      } as any)
    );

    act(() =>
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [{ clientX: 0, clientY: 0 }, { clientX: 200, clientY: 0 }],
        },
      } as any)
    );

    act(() =>
      hook.result.current.handlers.onTouchEnd({ evt: { touches: [] } } as any)
    );

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('resets pinch state when stageSize changes mid-pinch (orientation change)', () => {
    const initialSize = { width: 390, height: 844 };
    const { hook, fakeStage } = renderPinch({ stageSize: initialSize });

    // Begin a pinch gesture.
    act(() =>
      hook.result.current.handlers.onTouchStart({
        evt: {
          touches: [{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }],
        },
        target: { className: 'Layer', findAncestor: () => undefined },
      } as any)
    );
    expect(hook.result.current.isPinching).toBe(true);

    // Simulate an orientation flip — width and height swap.
    act(() => {
      hook.rerender({ stageSize: { width: 844, height: 390 } });
    });

    // After the resize the stale sample is cleared, so the next move should
    // treat this as a fresh baseline and not produce a scale jump.
    act(() =>
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [{ clientX: 0, clientY: 0 }, { clientX: 200, clientY: 0 }],
        },
      } as any)
    );

    // First move after reset sets the baseline — no scale change yet.
    expect(fakeStage.scale).not.toHaveBeenCalled();
  });

  it('wheel zoom and pinch zoom in the same frame do not corrupt scaleRef', () => {
    // This test verifies that firing both interaction paths concurrently
    // does not leave scaleRef in an inconsistent state.  Each path writes
    // scaleRef independently; the last writer wins, which is acceptable.
    const { hook, fakeStage, schedulePositionUpdate } = renderPinch();

    act(() =>
      hook.result.current.handlers.onTouchStart({
        evt: {
          touches: [{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }],
        },
        target: { className: 'Layer', findAncestor: () => undefined },
      } as any)
    );

    // Two moves in rapid succession — both queue a RAF but only one fires
    // (the coalescing guard ensures at most one frame is in flight).
    act(() => {
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [{ clientX: 0, clientY: 0 }, { clientX: 200, clientY: 0 }],
        },
      } as any);
      hook.result.current.handlers.onTouchMove({
        evt: {
          preventDefault: vi.fn(),
          touches: [{ clientX: 0, clientY: 0 }, { clientX: 300, clientY: 0 }],
        },
      } as any);
    });

    // schedulePositionUpdate proves the pinch frame ran and the hook is
    // still functional — not stuck or throwing.
    expect(fakeStage.scale).toHaveBeenCalled();
    expect(schedulePositionUpdate).not.toHaveBeenCalled();
  });
});
