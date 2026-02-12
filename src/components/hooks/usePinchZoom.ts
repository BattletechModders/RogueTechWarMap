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
      const newDistance = getDistance(touch1, touch2);
      if (!lastDistance.current) return;

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
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      const worldPos = {
        x: (pinchCenter.x - stagePos.x) / stageScale,
        y: (pinchCenter.y - stagePos.y) / stageScale,
      };

      requestAnimationFrame(() => {
        const newPos = {
          x: pinchCenter.x - worldPos.x * newScale,
          y: pinchCenter.y - worldPos.y * newScale,
        };

        scaleRef.current = newScale;
        positionRef.current = newPos;

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);

        requestBatchDraw(stage);
        setZoomScaleFactor(newScale);
      });

      lastDistance.current = newDistance;
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
    if (e.evt.touches.length < 2) setIsPinching(false);
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
