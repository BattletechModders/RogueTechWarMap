import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('react-konva', async () => {
  const mod = await import('../../test/konvaMocks');
  return mod.reactKonvaStubs;
});

vi.mock('konva', async () => {
  const mod = await import('../../test/konvaMocks');
  return mod.konvaStub;
});

import StarSystem from './StarSystem';
import type {
  DisplayStarSystemType,
  FactionDataType,
} from '../hooks/types';

const baseSystem: DisplayStarSystemType = {
  name: 'Terra',
  posX: 10,
  posY: 20,
  owner: 'DAVION',
  factions: [
    { Name: 'DAVION', control: 50, ActivePlayers: 3 },
    { Name: 'KURITA', control: 30, ActivePlayers: 0 },
  ],
  sysUrl: '/systems/terra',
  state: {},
  isCapital: false,
  factionColour: '#ff0',
  factionName: 'Davion',
};

const factions: FactionDataType = {
  DAVION: { colour: '#ff0', prettyName: 'Davion', id: 1, capital: 'Terra' },
  KURITA: { colour: '#f00', prettyName: 'Kurita', id: 2, capital: 'Luthien' },
};

const renderStar = (overrides: Partial<DisplayStarSystemType> = {}) => {
  const system: DisplayStarSystemType = { ...baseSystem, ...overrides };
  return render(
    <StarSystem
      system={system}
      factions={factions}
      zoomScaleFactor={1}
      settings={{ flashActivePlayes: true }}
      showTooltip={vi.fn()}
      hideTooltip={vi.fn()}
      tooltipVisibleRef={{ current: false }}
      touchedSystemNameRef={{ current: null }}
    />
  );
};

describe('StarSystem (smoke)', () => {
  it('mounts without throwing for a basic system', () => {
    expect(() => renderStar()).not.toThrow();
  });

  it('renders at least one faction-colored circle (the main system node)', () => {
    const { container } = renderStar();
    const circles = container.querySelectorAll('[data-fill="#ff0"]');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('renders extra glow layers when the system has insurrection state', () => {
    const baseline = renderStar();
    const baseCount = baseline.container.querySelectorAll('span').length;

    const withState = renderStar({ state: { isInsurrect: true } });
    const withCount = withState.container.querySelectorAll('span').length;

    expect(withCount).toBeGreaterThan(baseCount);
  });

  it('mounts without throwing when a pirate raid is active', () => {
    expect(() =>
      renderStar({ state: { hasPirateRaid: true } })
    ).not.toThrow();
  });

  it('mounts without throwing when a hold-the-line event is active', () => {
    expect(() =>
      renderStar({ state: { hasHoldTheLineEvent: true } })
    ).not.toThrow();
  });

  it('mounts without throwing when a capture event is active', () => {
    expect(() =>
      renderStar({ state: { hasCaptureEvent: true } })
    ).not.toThrow();
  });

  it('capitals render with a larger baseline radius', () => {
    const { container } = renderStar({ isCapital: true });
    const radii = Array.from(container.querySelectorAll('[data-radius]'))
      .map((el) => Number((el as HTMLElement).dataset.radius))
      .filter((n) => !Number.isNaN(n));
    expect(radii.some((r) => r >= 2.5)).toBe(true);
  });
});
