import { useCallback, useRef, useState } from 'react';
import Konva from 'konva';
import type { Point } from '../GalaxyMap/gm.types';
import { getDistance } from '../GalaxyMap/gm.interactions';

type UsePinchZoomArgs = {
  stageRef: React.RefObject<Konva.Stage | null>;
  scaleRef: React.MutableRefObject<number>;
  positionRef: React.MutableRefObject<Point>;

  // from useGalaxyViewport (temporarily exposed)
  requestBatchDraw: (stage: Konva.Stage) => void;
  setZoomScaleFactor: React.Dispatch<React.SetStateAction<number>>;

  hideTooltip?: () => void;

  minScale?: number;
  maxScale?: number;
};

export function usePinchZoom({
  stageRef,
  scaleRef,
  positionRef,
  requestBatchDraw,
  setZoomScaleFactor,
  hideTooltip,
  minScale = 0.2,
  maxScale = 25,
}: UsePinchZoomArgs) {
  const [isPinching, setIsPinching] = useState(false);
  const lastDistance = useRef(0);
  const frameRequestId = useRef<number | null>(null);
  const frameQueued = useRef(false);
  const latestPinchSample = useRef<{
    touch1: { clientX: number; clientY: number };
    touch2: { clientX: number; clientY: number };
  } | null>(null);

  const onTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      // Single touch: hide tooltip if tapped background (same behavior as your current code)
      if (e.evt.touches.length === 1) {
        const isCircle = e.target.className === 'Circle';
        const isTooltip = e.target.findAncestor('Label', true);
        if (!isCircle && !isTooltip) hideTooltip?.();
      }

      // Two-finger pinch start
      if (e.evt.touches.length === 2) {
        setIsPinching(true);
        lastDistance.current = getDistance(e.evt.touches[0], e.evt.touches[1]);
      }
    },
    [hideTooltip]
  );

  const onTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length !== 2 || !isPinching) return;

      e.evt.preventDefault();

      const [touch1, touch2] = e.evt.touches;
      latestPinchSample.current = {
        touch1: { clientX: touch1.clientX, clientY: touch1.clientY },
        touch2: { clientX: touch2.clientX, clientY: touch2.clientY },
      };

      if (frameQueued.current) return;
      frameQueued.current = true;

      frameRequestId.current = requestAnimationFrame(() => {
        frameQueued.current = false;

        const sample = latestPinchSample.current;
        if (!sample) return;

        const newDistance = Math.hypot(
          sample.touch2.clientX - sample.touch1.clientX,
          sample.touch2.clientY - sample.touch1.clientY
        );
        if (!lastDistance.current) {
          lastDistance.current = newDistance;
          return;
        }

        const stage = stageRef.current;
        if (!stage) return;

        let scaleBy = newDistance / lastDistance.current;

        // Prevent jitter and dead zone on Firefox
        if (Math.abs(1 - scaleBy) < 0.02) return;

        // Clamp to avoid huge jumps
        scaleBy = Math.max(0.9, Math.min(1.1, scaleBy));

        const oldScale = scaleRef.current ?? 1;
        const newScale = Math.max(
          minScale,
          Math.min(maxScale, oldScale * scaleBy)
        );

        const stagePos = stage.getPosition();
        const stageScale = stage.scaleX();

        const pinchCenter = {
          x: (sample.touch1.clientX + sample.touch2.clientX) / 2,
          y: (sample.touch1.clientY + sample.touch2.clientY) / 2,
        };

        const worldPos = {
          x: (pinchCenter.x - stagePos.x) / stageScale,
          y: (pinchCenter.y - stagePos.y) / stageScale,
        };

        const newPos = {
          x: pinchCenter.x - worldPos.x * newScale,
          y: pinchCenter.y - worldPos.y * newScale,
        };

        scaleRef.current = newScale;
        positionRef.current = newPos;

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);

        requestBatchDraw(stage);

        lastDistance.current = newDistance;
      });
    },
    [
      isPinching,
      maxScale,
      minScale,
      positionRef,
      requestBatchDraw,
      scaleRef,
      setZoomScaleFactor,
      stageRef,
    ]
  );

  const onTouchEnd = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length < 2) {
      setIsPinching(false);
      setZoomScaleFactor(scaleRef.current);
      latestPinchSample.current = null;
      if (frameRequestId.current !== null) {
        cancelAnimationFrame(frameRequestId.current);
        frameRequestId.current = null;
      }
      frameQueued.current = false;
    }
  }, []);

  return {
    isPinching,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
