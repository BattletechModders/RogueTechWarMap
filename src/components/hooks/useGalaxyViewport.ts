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
  // Expose these so other hooks (tooltip) can consume them.
  const stageRef = useRef<Konva.Stage | null>(null);

  const scaleRef = useRef<number>(1);
  const positionRef = useRef<Point>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  // Used by StarSystem sizing logic already in your component.
  const [zoomScaleFactor, setZoomScaleFactor] = useState<number>(1);

  // ---- batched draw (fixed: must persist across renders)
  const frameRequestedRef = useRef(false);
  const requestBatchDraw = useCallback((stage: Konva.Stage) => {
    if (frameRequestedRef.current) return;
    frameRequestedRef.current = true;

    requestAnimationFrame(() => {
      stage.batchDraw();
      frameRequestedRef.current = false;
    });
  }, []);

  // ---- wheel throttle
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

      // World coords under pointer before zoom
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Update refs
      scaleRef.current = newScale;
      positionRef.current = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      // Apply to stage (imperative — avoids rerender dependency)
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

  // This view object is useful for Stage props & tooltip scaling.
  // Note: it only updates on React re-renders (wheel triggers one via zoomScaleFactor).
  const view: ViewTransform = useMemo(
    () => ({
      scale: scaleRef.current,
      position: positionRef.current,
    }),
    // re-render triggers recompute; refs don't cause renders
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
