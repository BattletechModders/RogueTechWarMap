import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('react-konva', async () => {
  const mod = await import('./test/konvaMocks');
  return mod.reactKonvaStubs;
});

vi.mock('konva', async () => {
  const mod = await import('./test/konvaMocks');
  return mod.konvaStub;
});

const createRootSpy = vi.fn();
vi.mock('react-dom/client', async () => {
  const actual = await vi.importActual<typeof import('react-dom/client')>(
    'react-dom/client'
  );
  return {
    ...actual,
    createRoot: (el: Element) => {
      createRootSpy(el);
      return actual.createRoot(el);
    },
  };
});

const buildResponse = (payload: unknown) =>
  ({ ok: true, json: async () => payload } as unknown as Response);

afterEach(() => {
  vi.unstubAllGlobals();
  document.getElementById('react-root')?.remove();
  createRootSpy.mockClear();
});

describe('main.tsx bootstrap', () => {
  it('calls createRoot on the #react-root element and renders App', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/starmap/warmap')) return buildResponse([]);
        return buildResponse({});
      })
    );
    const rootEl = document.createElement('div');
    rootEl.id = 'react-root';
    document.body.appendChild(rootEl);

    await expect(import('./main')).resolves.toBeDefined();

    expect(createRootSpy).toHaveBeenCalledWith(rootEl);
  });
});
