import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

vi.mock('react-konva', async () => {
  const mod = await import('../../test/konvaMocks');
  return mod.reactKonvaStubs;
});

vi.mock('konva', async () => {
  const mod = await import('../../test/konvaMocks');
  return mod.konvaStub;
});

const buildResponse = (payload: unknown) =>
  ({ ok: true, json: async () => payload } as unknown as Response);

let GalaxyMapModule: typeof import('./GalaxyMap');

beforeEach(async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/factions/warmap')) {
        return buildResponse({
          DAVION: {
            colour: '#ff0',
            prettyName: 'Davion',
            id: 1,
            capital: 'Terra',
          },
        });
      }
      if (url.includes('/starmap/warmap')) {
        return buildResponse([
          {
            name: 'Terra',
            posX: 0,
            posY: 0,
            owner: 'DAVION',
            factions: [{ Name: 'DAVION', control: 100, ActivePlayers: 2 }],
            sysUrl: '/systems/terra',
          },
        ]);
      }
      return buildResponse({});
    })
  );
  GalaxyMapModule = await import('./GalaxyMap');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('GalaxyMap page (smoke)', () => {
  it('renders nothing until systems and factions arrive', () => {
    const { container } = render(<GalaxyMapModule.default />);
    expect(container.textContent).toBe('');
  });

  it('mounts the stage tree once systems, factions, and capitals are fetched', async () => {
    const { container } = render(<GalaxyMapModule.default />);

    await waitFor(
      () => {
        expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it('exports `Map` as an alias for the default export', () => {
    expect(GalaxyMapModule.default).toBe(GalaxyMapModule.Map);
  });
});
