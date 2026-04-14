import { useRef } from 'react';
import Konva from 'konva';
import type { Point } from '../GalaxyMap/gm.types';
import { requestBatchDraw } from './canvasUtils';

const MIN_SCALE = 0.2;
const MAX_SCALE = 25;
const WHEEL_THROTTLE_MS = 50;

const useZoomPan = (
  stageRef: React.RefObject<Konva.Stage | null>,
  scaleRef: React.MutableRefObject<number>,
  positionRef: React.MutableRefObject<Point>,
  onScaleChange: (scale: number) => void
) => {
  const lastWheelTime = useRef(0);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    const now = performance.now();
    if (now - lastWheelTime.current < WHEEL_THROTTLE_MS) return;

    lastWheelTime.current = now;

    e.evt.preventDefault();
    const scaleBy = 1.25;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = scaleRef.current;
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    scaleRef.current = newScale;
    positionRef.current = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(positionRef.current);
    requestBatchDraw(stage);
    onScaleChange(scaleRef.current < 1 ? scaleRef.current : 1);
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    positionRef.current = { x: e.target.x(), y: e.target.y() };
  };

  return { handleWheel, handleDragMove };
};

export default useZoomPan;
