import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('react-konva', async () => {
  const mod = await import('./test/konvaMocks');
  return mod.reactKonvaStubs;
});

vi.mock('konva', async () => {
  const mod = await import('./test/konvaMocks');
  return mod.konvaStub;
});

const buildResponse = (payload: unknown) =>
  ({ ok: true, json: async () => payload } as unknown as Response);

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/starmap/warmap')) return buildResponse([]);
        return buildResponse({});
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts under RouterProvider without throwing', async () => {
    const { default: App } = await import('./App');
    expect(() => render(<App />)).not.toThrow();
  });
});
