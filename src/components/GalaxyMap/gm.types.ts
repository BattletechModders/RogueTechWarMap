export type Point = { x: number; y: number };

/** Stage (canvas) size used by React-Konva <Stage> */
export interface StageSize {
  width: number;
  height: number;
}

/** Tooltip shape as consumed by GalaxyMap.tsx */
export interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  text: string;
  onTouch?: () => void;
}

/** View transform pieces GalaxyMap manages internally */
export interface ViewTransform {
  /** Current zoom scale (e.g., 0.2 .. 25) */
  scale: number;
  /** Stage position (screen-space) */
  position: Point;
}
