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
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  // Exposes current scale to React consumers that need rerenders (like star node sizing).
  const [zoomScaleFactor, setZoomScaleFactor] = useState<number>(1);

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

      requestBatchDraw(stage);

      setZoomScaleFactor(newScale);
    },
    [maxScale, minScale, requestBatchDraw, wheelThrottleMs]
  );

  const onDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    positionRef.current = { x: e.target.x(), y: e.target.y() };
  }, []);

  // Build a memoized snapshot consumed by Stage props and tooltip scaling.
  // It intentionally updates only on React render so we avoid excess calculations.
  const view: ViewTransform = useMemo(
    () => ({
      scale: scaleRef.current,
      position: positionRef.current,
    }),
    // Re-render is required here because refs update without triggering React by design.
    [zoomScaleFactor]
  );

  return {
    stageRef,
    scaleRef,
    positionRef,
    view,
    zoomScaleFactor,

    requestBatchDraw,
    setZoomScaleFactor,

    handlers: {
      onWheel,
      onDragMove,
    },
  };
}
