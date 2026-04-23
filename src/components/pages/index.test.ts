import { describe, it, expect, vi } from 'vitest';

// GalaxyMap is the only re-export that pulls in react-konva, so silence it here.
vi.mock('react-konva', async () => {
  const React = await import('react');
  const passthrough = (tag: string) =>
    ({ children, ...rest }: any) => React.createElement(tag, rest, children);
  return {
    Stage: passthrough('div'),
    Layer: passthrough('div'),
    Image: passthrough('div'),
    Text: passthrough('span'),
    Group: passthrough('div'),
    Rect: passthrough('div'),
    Line: passthrough('div'),
    Circle: passthrough('div'),
  };
});

vi.mock('konva', () => {
  class Animation {
    start() {}
    stop() {}
  }
  class Text {
    constructor(_opts: any) {}
    width() {
      return 10;
    }
    destroy() {}
  }
  return {
    default: { Animation, Text },
    __esModule: true,
  };
});

describe('pages barrel', () => {
  it('re-exports Home and Map', async () => {
    const pages = await import('./index');
    expect(pages.Home).toBeDefined();
    expect(pages.Map).toBeDefined();
    expect(typeof pages.Home).toBe('function');
    expect(typeof pages.Map).toBe('function');
  });

  it('exposes exactly Home and Map', async () => {
    const pages = await import('./index');
    expect(Object.keys(pages).sort()).toEqual(['Home', 'Map']);
  });
});
