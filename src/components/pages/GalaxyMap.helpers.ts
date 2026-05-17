import type { StageSize, ViewTransform } from '../GalaxyMap/gm.types';

export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const getViewportBounds = (
  stageSize: StageSize,
  view: ViewTransform,
  screenMargin = 120
): ViewportBounds => {
  if (stageSize.width <= 0 || stageSize.height <= 0) {
    return {
      left: Number.NEGATIVE_INFINITY,
      right: Number.POSITIVE_INFINITY,
      top: Number.NEGATIVE_INFINITY,
      bottom: Number.POSITIVE_INFINITY,
    };
  }

  const margin = Math.max(screenMargin / view.scale, 1);
  const left = (0 - view.position.x) / view.scale - margin;
  const top = (0 - view.position.y) / view.scale - margin;
  const right = (stageSize.width - view.position.x) / view.scale + margin;
  const bottom = (stageSize.height - view.position.y) / view.scale + margin;

  return { left, right, top, bottom };
};

export const getViewportSize = (): StageSize => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const getTooltipFontSize = (): number => {
  if (typeof document === 'undefined') {
    return 16 * 0.85;
  }

  return parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.85;
};

export interface DesktopLineSegment {
  text: string;
  fontStyle: 'bold' | 'normal';
  fontSize: number;
}

export interface DesktopLineSizes {
  titleFontSize: number;
  bodyFontSize: number;
}

export const getDesktopLineSegments = (
  line: string,
  index: number,
  sizes: DesktopLineSizes
): DesktopLineSegment[] => {
  if (index === 0) {
    return [
      {
        text: line,
        fontStyle: 'bold',
        fontSize: sizes.titleFontSize,
      },
    ];
  }

  const match = line.match(/^(Owner:|Damage:)\s*(.*)$/);
  if (match) {
    const [, label, value] = match;
    return [
      { text: `${label} `, fontStyle: 'bold', fontSize: sizes.bodyFontSize },
      { text: value, fontStyle: 'normal', fontSize: sizes.bodyFontSize },
    ];
  }

  return [
    {
      text: line,
      fontStyle: /^(Control|State):/.test(line) ? 'bold' : 'normal',
      fontSize: sizes.bodyFontSize,
    },
  ];
};

export interface MobileTooltipData {
  title: string;
  subtitle: string;
  details: string[];
}

export const parseMobileTooltipData = (text: string | undefined): MobileTooltipData => {
  const trimmed = text?.trim();
  if (!trimmed) {
    return { title: '', subtitle: '', details: [] };
  }

  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line !== '[Tap to open]');

  const title = lines[0] ?? '';
  const subtitle = lines[1]?.startsWith('(') ? lines[1] : '';
  const rawDetails = lines.slice(subtitle ? 2 : 1);
  const details: string[] = [];
  let inControlBlock = false;

  for (const line of rawDetails) {
    if (line === 'Control:') {
      inControlBlock = true;
      continue;
    }

    if (inControlBlock) {
      const isKeyValueLine = /^[A-Za-z ]+:\s/.test(line);
      if (!isKeyValueLine) {
        continue;
      }
      inControlBlock = false;
    }

    details.push(line);
  }

  return { title, subtitle, details };
};
