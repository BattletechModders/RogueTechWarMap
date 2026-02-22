import { useState } from 'react';
import type { TooltipControlItem } from '../GalaxyMap/gm.types';

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
  onTouch?: () => void;
  controlItems?: TooltipControlItem[];
}

const useTooltip = (scaleRef: React.RefObject<number>) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  });

  const showTooltip = (
    text: string,
    pointerX: number,
    pointerY: number,
    stageX?: number,
    stageY?: number,
    onTouch?: () => void,
    controlItems?: TooltipControlItem[]
  ) => {
    const scale = scaleRef.current || 1;

    setTooltip({
      visible: true,
      text,
      x: stageX !== undefined ? (pointerX - stageX) / scale : pointerX,
      y: stageY !== undefined ? (pointerY - stageY) / scale : pointerY,
      onTouch,
      controlItems,
    });
  };

  const hideTooltip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return { tooltip, showTooltip, hideTooltip };
};

export default useTooltip;
