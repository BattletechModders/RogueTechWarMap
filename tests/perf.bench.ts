/**
 * Performance benchmarks for the hot paths in GalaxyMap.
 *
 * Run with:  yarn bench
 *
 * Each describe block pairs a "current" implementation against a candidate
 * optimisation so the output directly shows whether the change is worth making.
 */
import { bench, describe } from 'vitest';
import { buildFactionFilterOptions } from '../src/components/GalaxyMap/gm.selectors';
import type { DisplayStarSystemType } from '../src/components/hooks/types';

// ---------------------------------------------------------------------------
// Shared test-data helpers
// ---------------------------------------------------------------------------

type ViewTransform = { scale: number; position: { x: number; y: number } };
type StageSize = { width: number; height: number };
type Bounds = { left: number; right: number; top: number; bottom: number };

function makeSystem(
  name: string,
  posX: number,
  posY: number,
  owner = 'Faction_A'
): DisplayStarSystemType {
  return {
    name,
    posX,
    posY,
    owner,
    factions: [],
    id: `${name}-${posX}-${posY}`,
    factionColour: '#ff0000',
    factionName: 'Faction A',
    normalizedName: name.toLowerCase(),
    isCapital: false,
  };
}

/** Spread N systems uniformly across the coordinate range [-range, +range]. */
function makeSystems(n: number, range = 500): DisplayStarSystemType[] {
  const systems: DisplayStarSystemType[] = [];
  const owners = ['Faction_A', 'Faction_B', 'Faction_C', 'Faction_D'];
  for (let i = 0; i < n; i++) {
    const posX = ((i / n) * 2 - 1) * range;
    const posY = (((i * 7) % n) / n * 2 - 1) * range;
    systems.push(
      makeSystem(`System_${i}`, posX, posY, owners[i % owners.length])
    );
  }
  return systems;
}

/**
 * Pre-converted variant: numeric x/y stored alongside posX/posY.
 * Built in a single pass to avoid double-spread hidden-class fragmentation.
 * This mirrors what projectSystemData would produce if it included x/y.
 */
type SystemWithNumericCoords = DisplayStarSystemType & { x: number; y: number };

function makeSystemsPreConverted(
  n: number,
  range = 500
): SystemWithNumericCoords[] {
  const systems: SystemWithNumericCoords[] = [];
  const owners = ['Faction_A', 'Faction_B', 'Faction_C', 'Faction_D'];
  for (let i = 0; i < n; i++) {
    const posX = ((i / n) * 2 - 1) * range;
    const posY = (((i * 7) % n) / n * 2 - 1) * range;
    const owner = owners[i % owners.length];
    systems.push({
      name: `System_${i}`,
      posX,
      posY,
      owner,
      factions: [],
      id: `System_${i}-${posX}-${posY}`,
      factionColour: '#ff0000',
      factionName: 'Faction A',
      normalizedName: `system_${i}`,
      isCapital: false,
      x: posX,
      y: -posY,
    });
  }
  return systems;
}

function getViewportBounds(
  stageSize: StageSize,
  view: ViewTransform,
  screenMargin = 120
): Bounds {
  if (stageSize.width <= 0 || stageSize.height <= 0) {
    return {
      left: -Infinity,
      right: Infinity,
      top: -Infinity,
      bottom: Infinity,
    };
  }
  const margin = Math.max(screenMargin / view.scale, 1);
  return {
    left: (0 - view.position.x) / view.scale - margin,
    top: (0 - view.position.y) / view.scale - margin,
    right: (stageSize.width - view.position.x) / view.scale + margin,
    bottom: (stageSize.height - view.position.y) / view.scale + margin,
  };
}

// Viewport scenarios
const STAGE: StageSize = { width: 1920, height: 1080 };

// Zoomed in: small window, ~10% of systems visible
const VIEW_TIGHT: ViewTransform = { scale: 5, position: { x: 960, y: 540 } };
// Medium zoom: ~40% visible
const VIEW_MID: ViewTransform = { scale: 1.5, position: { x: 960, y: 540 } };
// Zoomed out: full map visible
const VIEW_WIDE: ViewTransform = { scale: 0.5, position: { x: 960, y: 540 } };

const SYSTEMS_2K = makeSystems(2000);
const SYSTEMS_2K_PRE = makeSystemsPreConverted(2000);

// ---------------------------------------------------------------------------
// 1. visibleSystems — current vs pre-converted coords
// ---------------------------------------------------------------------------

describe('visibleSystems filter — tight zoom (~10% visible)', () => {
  const viewport = getViewportBounds(STAGE, VIEW_TIGHT);
  const selectedFactionsSet = new Set<string>();

  bench('current: Number(posX) per iteration', () => {
    SYSTEMS_2K.filter((s) => {
      const x = Number(s.posX);
      const y = -Number(s.posY);
      if (x < viewport.left || x > viewport.right) return false;
      if (y < viewport.top || y > viewport.bottom) return false;
      return !selectedFactionsSet.size || selectedFactionsSet.has(s.factionName);
    });
  });

  bench('optimised: pre-converted x/y fields', () => {
    SYSTEMS_2K_PRE.filter((s) => {
      if (s.x < viewport.left || s.x > viewport.right) return false;
      if (s.y < viewport.top || s.y > viewport.bottom) return false;
      return !selectedFactionsSet.size || selectedFactionsSet.has(s.factionName);
    });
  });
});

describe('visibleSystems filter — medium zoom (~40% visible)', () => {
  const viewport = getViewportBounds(STAGE, VIEW_MID);
  const selectedFactionsSet = new Set<string>();

  bench('current: Number(posX) per iteration', () => {
    SYSTEMS_2K.filter((s) => {
      const x = Number(s.posX);
      const y = -Number(s.posY);
      if (x < viewport.left || x > viewport.right) return false;
      if (y < viewport.top || y > viewport.bottom) return false;
      return !selectedFactionsSet.size || selectedFactionsSet.has(s.factionName);
    });
  });

  bench('optimised: pre-converted x/y fields', () => {
    SYSTEMS_2K_PRE.filter((s) => {
      if (s.x < viewport.left || s.x > viewport.right) return false;
      if (s.y < viewport.top || s.y > viewport.bottom) return false;
      return !selectedFactionsSet.size || selectedFactionsSet.has(s.factionName);
    });
  });
});

describe('visibleSystems filter — wide zoom (full map visible)', () => {
  const viewport = getViewportBounds(STAGE, VIEW_WIDE);
  const selectedFactionsSet = new Set<string>();

  bench('current: Number(posX) per iteration', () => {
    SYSTEMS_2K.filter((s) => {
      const x = Number(s.posX);
      const y = -Number(s.posY);
      if (x < viewport.left || x > viewport.right) return false;
      if (y < viewport.top || y > viewport.bottom) return false;
      return !selectedFactionsSet.size || selectedFactionsSet.has(s.factionName);
    });
  });

  bench('optimised: pre-converted x/y fields', () => {
    SYSTEMS_2K_PRE.filter((s) => {
      if (s.x < viewport.left || s.x > viewport.right) return false;
      if (s.y < viewport.top || s.y > viewport.bottom) return false;
      return !selectedFactionsSet.size || selectedFactionsSet.has(s.factionName);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Faction filter — checking whether Set.has is actually fast at scale
// ---------------------------------------------------------------------------

describe('visibleSystems — faction filter overhead', () => {
  const viewport = getViewportBounds(STAGE, VIEW_WIDE);

  bench('no faction filter (selectedFactions empty)', () => {
    const set = new Set<string>();
    SYSTEMS_2K_PRE.filter((s) => {
      if (s.x < viewport.left || s.x > viewport.right) return false;
      if (s.y < viewport.top || s.y > viewport.bottom) return false;
      return !set.size || set.has(s.factionName);
    });
  });

  bench('single faction selected (Set.has every iteration)', () => {
    const set = new Set(['Faction A']);
    SYSTEMS_2K_PRE.filter((s) => {
      if (s.x < viewport.left || s.x > viewport.right) return false;
      if (s.y < viewport.top || s.y > viewport.bottom) return false;
      return !set.size || set.has(s.factionName);
    });
  });

  bench('three factions selected', () => {
    const set = new Set(['Faction A', 'Faction B', 'Faction C']);
    SYSTEMS_2K_PRE.filter((s) => {
      if (s.x < viewport.left || s.x > viewport.right) return false;
      if (s.y < viewport.top || s.y > viewport.bottom) return false;
      return !set.size || set.has(s.factionName);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. JSX element construction — cost of the renderedSystems map
//
// React.createElement is called for every visible system on every pan frame,
// even when StarSystem is memoized (memo prevents re-render, not element
// construction). This measures that fixed overhead.
// ---------------------------------------------------------------------------

// Minimal stand-in that matches the shape StarSystem receives.
type FakeProps = {
  key: string;
  system: DisplayStarSystemType;
  zoomScaleFactor: number;
  factions: object;
  highlighted: boolean;
  opacity: number;
};

const stableShowTooltip = () => {};
const stableHideTooltip = () => {};
const stableTooltipRef = { current: false };
const stableTouchRef = { current: null };
const stableFactions = {};

function buildRenderedSystemsPropsOldKey(
  systems: DisplayStarSystemType[],
  zoomFactor: number
): FakeProps[] {
  return systems.map((s) => ({
    key: `${s.name}-${s.posX}-${s.posY}-${s.owner}`,
    system: s,
    zoomScaleFactor: zoomFactor,
    factions: stableFactions,
    settings: { flashActivePlayers: true },
    showTooltip: stableShowTooltip,
    hideTooltip: stableHideTooltip,
    tooltipVisibleRef: stableTooltipRef,
    touchedSystemNameRef: stableTouchRef,
    highlighted: false,
    opacity: 1,
  }));
}

// Uses the pre-computed system.id field (name+posX+posY, built once at projection time).
function buildRenderedSystemsProps(
  systems: DisplayStarSystemType[],
  zoomFactor: number
): FakeProps[] {
  return systems.map((s) => ({
    key: s.id,
    system: s,
    zoomScaleFactor: zoomFactor,
    factions: stableFactions,
    settings: { flashActivePlayers: true },
    showTooltip: stableShowTooltip,
    hideTooltip: stableHideTooltip,
    tooltipVisibleRef: stableTooltipRef,
    touchedSystemNameRef: stableTouchRef,
    highlighted: false,
    opacity: 1,
  }));
}

const VISIBLE_800 = SYSTEMS_2K.slice(0, 800);

describe('renderedSystems — JSX props construction (pan frame cost)', () => {
  bench('800 systems, composite key (before)', () => {
    buildRenderedSystemsPropsOldKey(VISIBLE_800, 1);
  });

  bench('800 systems, system.id key (after)', () => {
    buildRenderedSystemsProps(VISIBLE_800, 1);
  });
});

// ---------------------------------------------------------------------------
// 4. buildFactionFilterOptions — one-time on data load
// ---------------------------------------------------------------------------

const FACTIONS_DICT = {
  Faction_A: { prettyName: 'Faction A', colour: '#f00' },
  Faction_B: { prettyName: 'Faction B', colour: '#0f0' },
  Faction_C: { prettyName: 'Faction C', colour: '#00f' },
  Faction_D: { prettyName: 'Faction D', colour: '#ff0' },
};

describe('buildFactionFilterOptions', () => {
  bench('2 000 systems, 4 factions', () => {
    buildFactionFilterOptions(SYSTEMS_2K, FACTIONS_DICT);
  });
});

// ---------------------------------------------------------------------------
// 4. projectSystemData equivalent — coord coercion + faction lookup
// ---------------------------------------------------------------------------

const RAW_SYSTEMS = SYSTEMS_2K.map((s) => ({
  name: s.name,
  posX: s.posX,
  posY: s.posY,
  owner: s.owner,
  factions: [],
}));

describe('projectSystemData — data projection on load', () => {
  bench('current: no x/y in projection', () => {
    RAW_SYSTEMS.map((s) => {
      const faction = FACTIONS_DICT[s.owner as keyof typeof FACTIONS_DICT];
      return {
        ...s,
        isCapital: false,
        factionColour: faction?.colour ?? 'gray',
        factionName: faction?.prettyName ?? s.owner,
        normalizedName: s.name.toLowerCase(),
      };
    });
  });

  // Adds x/y to the same single spread — mirrors the actual code change cost.
  bench('with x/y in same spread', () => {
    RAW_SYSTEMS.map((s) => {
      const faction = FACTIONS_DICT[s.owner as keyof typeof FACTIONS_DICT];
      return {
        ...s,
        isCapital: false,
        factionColour: faction?.colour ?? 'gray',
        factionName: faction?.prettyName ?? s.owner,
        normalizedName: s.name.toLowerCase(),
        x: Number(s.posX),
        y: -Number(s.posY),
      };
    });
  });
});
