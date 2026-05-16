import React from 'react';
import { vi } from 'vitest';

const makeFakeNode = () => ({
  opacity: vi.fn(),
  scale: vi.fn(),
  position: vi.fn(),
  getLayer: () => null,
  getStage: () => null,
  batchDraw: vi.fn(),
  destroy: vi.fn(),
  container: vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
  getRelativePointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
  x: vi.fn(() => 0),
  y: vi.fn(() => 0),
  scaleX: vi.fn(() => 1),
  getPosition: vi.fn(() => ({ x: 0, y: 0 })),
});

export const passthrough = (tag: string) =>
  React.forwardRef<unknown, any>(function KonvaMock(
    { children, ...rest }: any,
    ref
  ) {
    const fake = React.useMemo(() => makeFakeNode(), []);
    React.useImperativeHandle(ref, () => fake);

    const safeProps: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (
        typeof v === 'string' ||
        typeof v === 'number' ||
        typeof v === 'boolean'
      ) {
        safeProps[`data-${k.toLowerCase()}`] = String(v);
      }
    }
    return React.createElement(tag, safeProps, children);
  });

export const reactKonvaStubs = {
  Stage: passthrough('div'),
  Layer: passthrough('div'),
  Image: passthrough('div'),
  Text: passthrough('span'),
  Group: passthrough('div'),
  Rect: passthrough('div'),
  Line: passthrough('span'),
  Circle: passthrough('span'),
};

export const konvaStub = (() => {
  class Animation {
    constructor(public cb: (frame: unknown) => void, public layer: unknown) {}
    start() {}
    stop() {}
  }
  class Text {
    constructor(public opts: unknown) {}
    width() {
      return 50;
    }
    destroy() {}
  }
  return { default: { Animation, Text }, __esModule: true };
})();
