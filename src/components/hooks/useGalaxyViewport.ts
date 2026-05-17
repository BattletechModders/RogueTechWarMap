import { useCallback, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import type { Point, ViewTransform } from '../GalaxyMap/gm.types';

type UseGalaxyViewportArgs = {
  minScale?: number;
  maxScale?: number;
  wheelThrottleMs?: number;
};

export function useGalaxyViewport({
  minScale = 0.2,
  maxScale = 25,
  wheelThrottleMs = 50,
}: UseGalaxyViewportArgs = {}) {
  // Shared refs let the tooltip/pinch hooks coordinate with the same stage instance.
  const stageRef = useRef<Konva.Stage | null>(null);

  const scaleRef = useRef<number>(1);
  const positionRef = useRef<Point>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  });

  // Synchronous scale-change listeners: called before requestBatchDraw queues its RAF
  // so group scales are always up-to-date before the canvas redraws.
  const scaleListenersRef = useRef<Set<(scale: number) => void>>(new Set());

  const registerScaleListener = useCallback((listener: (scale: number) => void) => {
    scaleListenersRef.current.add(listener);
    return () => { scaleListenersRef.current.delete(listener); };
  }, []);

  const notifyScaleListeners = useCallback((scale: number) => {
    scaleListenersRef.current.forEach((fn) => fn(scale));
  }, []);

  // Exposes current scale and position to React consumers that need rerenders.
  const [zoomScaleFactor, setZoomScaleFactor] = useState<number>(1);
  const [renderPosition, setRenderPosition] = useState<Point>(
    positionRef.current
  );
  const positionUpdateRequestedRef = useRef(false);

  const schedulePositionUpdate = useCallback(() => {
    if (positionUpdateRequestedRef.current) return;
    positionUpdateRequestedRef.current = true;

    requestAnimationFrame(() => {
      setRenderPosition(positionRef.current);
      positionUpdateRequestedRef.current = false;
    });
  }, []);

  // Batch draw calls per animation frame to avoid a Konva redraw storm during drag/zoom.
  const frameRequestedRef = useRef(false);
  const requestBatchDraw = useCallback((stage: Konva.Stage) => {
    if (frameRequestedRef.current) return;
    frameRequestedRef.current = true;

    requestAnimationFrame(() => {
      stage.batchDraw();
      frameRequestedRef.current = false;
    });
  }, []);

  // Throttle wheel events so each move doesn't enqueue unbounded zoom updates.
  const lastWheelTimeRef = useRef(0);

  const onWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      const now = performance.now();
      if (now - lastWheelTimeRef.current < wheelThrottleMs) return;
      lastWheelTimeRef.current = now;

      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.25;

      const oldScale = scaleRef.current;
      let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      // Capture map coordinates under the pointer before changing scale so zoom is centered.
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Update internal transform state for future gesture calculations.
      scaleRef.current = newScale;
      positionRef.current = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      // Apply transform directly to Konva instance to keep interaction feel snappy.
      stage.scale({ x: newScale, y: newScale });
      stage.position(positionRef.current);

      // Update star-size compensation before the canvas redraws so there's no lag.
      notifyScaleListeners(newScale);
      requestBatchDraw(stage);
      schedulePositionUpdate();
      setZoomScaleFactor(newScale);
    },
    [
      maxScale,
      minScale,
      notifyScaleListeners,
      requestBatchDraw,
      schedulePositionUpdate,
      wheelThrottleMs,
    ]
  );

  const onDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      positionRef.current = { x: e.target.x(), y: e.target.y() };
      schedulePositionUpdate();
    },
    [schedulePositionUpdate]
  );

  // Build a memoized snapshot consumed by Stage props and tooltip scaling.
  // It intentionally updates only on React render so we avoid excess calculations.
  const view: ViewTransform = useMemo(
    () => ({
      scale: scaleRef.current,
      position: renderPosition,
    }),
    // zoomScaleFactor is not read in the body but is intentionally listed here:
    // scaleRef is a ref so changes to it don't trigger React re-renders on their own.
    // Including zoomScaleFactor (which IS state) ensures view.scale stays current
    // after a zoom gesture, because scaleRef.current is read at memo-evaluation time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderPosition, zoomScaleFactor]
  );

  return {
    stageRef,
    scaleRef,
    positionRef,
    view,
    zoomScaleFactor,

    requestBatchDraw,
    schedulePositionUpdate,
    setZoomScaleFactor,
    registerScaleListener,
    notifyScaleListeners,

    handlers: {
      onWheel,
      onDragMove,
    },
  };
}
