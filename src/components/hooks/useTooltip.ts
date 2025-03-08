import { useState } from 'react';

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

const useTooltip = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  });

  const showTooltip = (text: string, x: number, y: number) => {
    setTooltip({ visible: true, text, x, y });
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, text: '', x: 0, y: 0 });
  };

  return { tooltip, showTooltip, hideTooltip };
};

export default useTooltip;
