import { useCallback, useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import type { Point } from '../GalaxyMap/gm.types';
import { getDistance } from '../GalaxyMap/gm.interactions';

type UsePinchZoomArgs = {
  stageRef: React.RefObject<Konva.Stage | null>;
  scaleRef: React.MutableRefObject<number>;
  positionRef: React.MutableRefObject<Point>;

  schedulePositionUpdate: () => void;
  setZoomScaleFactor: React.Dispatch<React.SetStateAction<number>>;
  notifyScaleListeners: (scale: number) => void;

  hideTooltip?: () => void;

  minScale?: number;
  maxScale?: number;

  stageSize?: { width: number; height: number };
};

export function usePinchZoom({
  stageRef,
  scaleRef,
  positionRef,
  schedulePositionUpdate,
  setZoomScaleFactor,
  notifyScaleListeners,
  hideTooltip,
  minScale = 0.2,
  maxScale = 25,
  stageSize,
}: UsePinchZoomArgs) {
  const [isPinching, setIsPinching] = useState(false);
  const isPinchingRef = useRef(false);
  const frameRequestId = useRef<number | null>(null);
  const frameQueued = useRef(false);
  const latestPinchSample = useRef<{
    touch1: { clientX: number; clientY: number };
    touch2: { clientX: number; clientY: number };
  } | null>(null);
  const pinchStartDistance = useRef(0);
  const pinchStartScale = useRef(1);
  const pinchAnchorWorld = useRef<Point | null>(null);
  const lastAppliedCenter = useRef<Point | null>(null);

  const getTouchPointInStage = useCallback(
    (touch: { clientX: number; clientY: number }, stage: Konva.Stage): Point => {
      const rect = stage.container()?.getBoundingClientRect?.();
      if (!rect) {
        return { x: touch.clientX, y: touch.clientY };
      }

      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    },
    []
  );

  const resetPinchGesture = useCallback(() => {
    pinchStartDistance.current = 0;
    pinchStartScale.current = 1;
    pinchAnchorWorld.current = null;
    lastAppliedCenter.current = null;
    latestPinchSample.current = null;
    if (frameRequestId.current !== null) {
      cancelAnimationFrame(frameRequestId.current);
      frameRequestId.current = null;
    }
    frameQueued.current = false;
  }, []);

  const initializePinchGesture = useCallback(
    (
      stage: Konva.Stage,
      touch1: { clientX: number; clientY: number },
      touch2: { clientX: number; clientY: number }
    ) => {
      const startDistance = getDistance(touch1 as Touch, touch2 as Touch);
      const touch1Point = getTouchPointInStage(touch1, stage);
      const touch2Point = getTouchPointInStage(touch2, stage);
      const startCenter = {
        x: (touch1Point.x + touch2Point.x) / 2,
        y: (touch1Point.y + touch2Point.y) / 2,
      };
      const stageScale = stage.scaleX() || 1;
      const stagePos = stage.getPosition();

      pinchStartDistance.current = startDistance;
      pinchStartScale.current = stageScale;
      pinchAnchorWorld.current = {
        x: (startCenter.x - stagePos.x) / stageScale,
        y: (startCenter.y - stagePos.y) / stageScale,
      };
      lastAppliedCenter.current = startCenter;
    },
    [getTouchPointInStage, scaleRef]
  );

  useEffect(() => {
    if (!isPinchingRef.current) return;
    resetPinchGesture();
  }, [resetPinchGesture, stageSize?.width, stageSize?.height]);

  const onTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length === 1) {
        const isCircle = e.target.className === 'Circle';
        const isTooltip = e.target.findAncestor('Label', true);
        if (!isCircle && !isTooltip) hideTooltip?.();
      }

      if (e.evt.touches.length === 2) {
        if (e.evt.cancelable) {
          e.evt.preventDefault();
        }

        const stage = stageRef.current;
        if (stage) {
          initializePinchGesture(stage, e.evt.touches[0], e.evt.touches[1]);
        }

        isPinchingRef.current = true;
        setIsPinching(true);
      }
    },
    [hideTooltip, initializePinchGesture, stageRef]
  );

  const onTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length !== 2 || !isPinchingRef.current) return;

      if (e.evt.cancelable) {
        e.evt.preventDefault();
      }

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

        const stage = stageRef.current;
        if (!stage) return;

        const newDistance = Math.hypot(
          sample.touch2.clientX - sample.touch1.clientX,
          sample.touch2.clientY - sample.touch1.clientY
        );
        if (newDistance === 0) return;

        const touch1Point = getTouchPointInStage(sample.touch1, stage);
        const touch2Point = getTouchPointInStage(sample.touch2, stage);
        const currentCenter = {
          x: (touch1Point.x + touch2Point.x) / 2,
          y: (touch1Point.y + touch2Point.y) / 2,
        };

        if (
          !pinchStartDistance.current ||
          !pinchAnchorWorld.current ||
          !lastAppliedCenter.current
        ) {
          initializePinchGesture(stage, sample.touch1, sample.touch2);
          return;
        }

        const requestedScale = Math.max(
          minScale,
          Math.min(
            maxScale,
            pinchStartScale.current * (newDistance / pinchStartDistance.current)
          )
        );
        const newPos = {
          x: currentCenter.x - pinchAnchorWorld.current.x * requestedScale,
          y: currentCenter.y - pinchAnchorWorld.current.y * requestedScale,
        };

        scaleRef.current = requestedScale;
        positionRef.current = newPos;

        stage.scale({ x: requestedScale, y: requestedScale });
        stage.position(newPos);

        stage.batchDraw();
        lastAppliedCenter.current = currentCenter;
      });
    },
    [
      getTouchPointInStage,
      initializePinchGesture,
      maxScale,
      minScale,
      positionRef,
      scaleRef,
      stageRef,
    ]
  );

  const onTouchEnd = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length < 2) {
        isPinchingRef.current = false;
        setIsPinching(false);
        notifyScaleListeners(scaleRef.current);
        setZoomScaleFactor(scaleRef.current);
        schedulePositionUpdate();
        hideTooltip?.();
        resetPinchGesture();
      }
    },
    [
      hideTooltip,
      notifyScaleListeners,
      resetPinchGesture,
      scaleRef,
      schedulePositionUpdate,
      setZoomScaleFactor,
    ]
  );

  return {
    isPinching,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
