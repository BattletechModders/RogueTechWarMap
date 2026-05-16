import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGalaxyViewport } from './useGalaxyViewport';

type FakeStage = {
  scale: ReturnType<typeof vi.fn>;
  position: ReturnType<typeof vi.fn>;
  getPointerPosition: ReturnType<typeof vi.fn>;
  x: ReturnType<typeof vi.fn>;
  y: ReturnType<typeof vi.fn>;
  batchDraw: ReturnType<typeof vi.fn>;
};

const buildFakeStage = (pointer = { x: 400, y: 300 }, offset = { x: 0, y: 0 }): FakeStage => ({
  scale: vi.fn(),
  position: vi.fn(),
  getPointerPosition: vi.fn(() => pointer),
  x: vi.fn(() => offset.x),
  y: vi.fn(() => offset.y),
  batchDraw: vi.fn(),
});

let rafQueue: FrameRequestCallback[] = [];
const flushRaf = () => {
  const queued = rafQueue.splice(0);
  queued.forEach((cb) => cb(performance.now()));
};

let mockNow = 10_000; // start at a time that clears every reasonable throttle
const advanceTime = (ms: number) => {
  mockNow += ms;
};

describe('useGalaxyViewport', () => {
  beforeEach(() => {
    rafQueue = [];
    mockNow = 10_000;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(((cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    }) as typeof window.requestAnimationFrame);
    vi.spyOn(performance, 'now').mockImplementation(() => mockNow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an initial view transform centered on the viewport with scale=1', () => {
    const { result } = renderHook(() => useGalaxyViewport());
    expect(result.current.view.scale).toBe(1);
    expect(result.current.view.position).toEqual({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    expect(result.current.zoomScaleFactor).toBe(1);
  });

  it('exposes the refs and handlers expected by the map', () => {
    const { result } = renderHook(() => useGalaxyViewport());
    expect(result.current.stageRef).toBeDefined();
    expect(result.current.scaleRef.current).toBe(1);
    expect(result.current.positionRef.current).toEqual(result.current.view.position);
    expect(typeof result.current.handlers.onWheel).toBe('function');
    expect(typeof result.current.handlers.onDragMove).toBe('function');
    expect(typeof result.current.requestBatchDraw).toBe('function');
  });

  it('onWheel preventDefaults the event and bails cleanly when stageRef is not attached', () => {
    const { result } = renderHook(() => useGalaxyViewport({ wheelThrottleMs: 0 }));
    const preventDefault = vi.fn();

    act(() => {
      result.current.handlers.onWheel({
        evt: { preventDefault, deltaY: -1 },
      } as any);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.view.scale).toBe(1);
  });

  it('onWheel with negative deltaY zooms in, clamping to maxScale', () => {
    const { result } = renderHook(() =>
      useGalaxyViewport({ maxScale: 2, minScale: 0.1, wheelThrottleMs: 0 })
    );
    const stage = buildFakeStage({ x: 100, y: 100 });
    act(() => {
      (result.current.stageRef as any).current = stage;
    });

    act(() => {
      result.current.handlers.onWheel({
        evt: { preventDefault: vi.fn(), deltaY: -1 },
      } as any);
    });

    expect(stage.scale).toHaveBeenCalled();
    const [{ x, y }] = stage.scale.mock.calls[0];
    expect(x).toBe(y);
    expect(x).toBeLessThanOrEqual(2);
    expect(x).toBeGreaterThan(1);
    expect(result.current.zoomScaleFactor).toBe(x);
  });

  it('onWheel with positive deltaY zooms out, clamping to minScale', () => {
    const { result } = renderHook(() =>
      useGalaxyViewport({ maxScale: 25, minScale: 0.5, wheelThrottleMs: 0 })
    );
    const stage = buildFakeStage({ x: 100, y: 100 });
    act(() => {
      (result.current.stageRef as any).current = stage;
    });

    act(() => {
      result.current.handlers.onWheel({
        evt: { preventDefault: vi.fn(), deltaY: 1 },
      } as any);
    });

    const [{ x }] = stage.scale.mock.calls[0];
    expect(x).toBeGreaterThanOrEqual(0.5);
    expect(x).toBeLessThan(1);
  });

  it('throttles a second wheel event within the configured window', () => {
    const { result } = renderHook(() =>
      useGalaxyViewport({ wheelThrottleMs: 100 })
    );
    const stage = buildFakeStage();
    act(() => {
      (result.current.stageRef as any).current = stage;
    });

    // First call at t = 10_000 clears the initial 0 → 10_000 gap, so scales once.
    act(() =>
      result.current.handlers.onWheel({
        evt: { preventDefault: vi.fn(), deltaY: -1 },
      } as any)
    );
    expect(stage.scale).toHaveBeenCalledTimes(1);

    // Second call 10 ms later is within the 100 ms window → throttled.
    advanceTime(10);
    act(() =>
      result.current.handlers.onWheel({
        evt: { preventDefault: vi.fn(), deltaY: -1 },
      } as any)
    );
    expect(stage.scale).toHaveBeenCalledTimes(1);

    // Third call after the window elapses → fires again.
    advanceTime(200);
    act(() =>
      result.current.handlers.onWheel({
        evt: { preventDefault: vi.fn(), deltaY: -1 },
      } as any)
    );
    expect(stage.scale).toHaveBeenCalledTimes(2);
  });

  it('onDragMove records the new stage position on the position ref', () => {
    const { result } = renderHook(() => useGalaxyViewport());
    const fakeTarget = { x: () => 11, y: () => 22 };

    act(() => {
      result.current.handlers.onDragMove({ target: fakeTarget } as any);
    });

    expect(result.current.positionRef.current).toEqual({ x: 11, y: 22 });
  });

  it('requestBatchDraw coalesces two synchronous calls into one frame', () => {
    const { result } = renderHook(() => useGalaxyViewport());
    const stage = buildFakeStage();

    act(() => {
      result.current.requestBatchDraw(stage as any);
      result.current.requestBatchDraw(stage as any);
    });

    // Both calls should queue at most one rAF.
    expect(rafQueue).toHaveLength(1);

    act(() => flushRaf());
    expect(stage.batchDraw).toHaveBeenCalledTimes(1);

    // After the frame flushes, a subsequent request should schedule a new frame.
    act(() => result.current.requestBatchDraw(stage as any));
    expect(rafQueue).toHaveLength(1);
    act(() => flushRaf());
    expect(stage.batchDraw).toHaveBeenCalledTimes(2);
  });
});
