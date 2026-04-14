import { useRef, useState } from 'react';
import Konva from 'konva';
import type { Point } from '../GalaxyMap/gm.types';
import { getDistance, requestBatchDraw } from './canvasUtils';

const MIN_SCALE = 0.2;
const MAX_SCALE = 25;

const usePinchZoom = (
  stageRef: React.RefObject<Konva.Stage | null>,
  scaleRef: React.MutableRefObject<number>,
  positionRef: React.MutableRefObject<Point>,
  hideTooltip: () => void,
  onScaleChange: (scale: number) => void
) => {
  const [isPinching, setIsPinching] = useState(false);
  const lastDistance = useRef(0);
  const pinchMidpoint = useRef<Point | null>(null);

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length === 1) {
      const stage = e.target.getStage();
      if (!stage) return;
      const isCircle = e.target.className === 'Circle';
      const isTooltip = e.target.findAncestor('Label', true);
      if (!isCircle && !isTooltip) {
        hideTooltip();
      }
    }

    if (e.evt.touches.length === 2) {
      setIsPinching(true);
      lastDistance.current = getDistance(e.evt.touches[0], e.evt.touches[1]);

      pinchMidpoint.current = {
        x: (e.evt.touches[0].clientX + e.evt.touches[1].clientX) / 2,
        y: (e.evt.touches[0].clientY + e.evt.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length === 2 && isPinching) {
      e.evt.preventDefault();

      if (!pinchMidpoint.current) return;

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

      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, scaleRef.current * scaleBy)
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
        onScaleChange(newScale < 1 ? newScale : 1);
      });

      lastDistance.current = newDistance;
    }
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length < 2) {
      setIsPinching(false);
    }
  };

  return {
    isPinching,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

export default usePinchZoom;
