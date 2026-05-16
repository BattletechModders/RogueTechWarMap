import type {
  DisplayStarSystemType,
  FactionDataType,
  Settings,
} from '../hooks/types';

export type Point = { x: number; y: number };

/** Stage viewport dimensions passed to <Stage> and updated when the browser resizes. */
export interface StageSize {
  width: number;
  height: number;
}

/** Tooltip payload shape read by GalaxyMap and rendered in both desktop and mobile views. */
export interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  text: string;
  onTouch?: () => void;
  controlItems?: TooltipControlItem[];
}

export interface TooltipControlItem {
  name: string;
  control: number;
  players: number;
}

/** Camera transform snapshot for the map viewport. */
export interface ViewTransform {
  /** Current zoom level, where 1 is normal scale and bounds are enforced by the viewport hook. */
  scale: number;
  /** Stage translation in screen coordinates after pan/drag and zoom operations. */
  position: Point;
}

export interface GalaxyMapRenderProps {
  systems: DisplayStarSystemType[];
  factions: FactionDataType;
  settings: Settings;
}

export type FactionName = string;
export type FactionNameList = FactionName[];
