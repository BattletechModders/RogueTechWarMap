# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev            # Start dev server (Vite HMR)
yarn build          # Type-check + production build (requires VITE_BASE_URL env var)
yarn build:test     # Production build with dev-state injection enabled
yarn lint           # ESLint
yarn test           # Vitest (single run)
yarn test:watch     # Vitest (watch mode)
yarn test:coverage  # Vitest with coverage report
yarn bench          # Vitest benchmarks (tests/perf.bench.ts)
```

**Run a single test file:**
```bash
yarn test -- src/components/hooks/useGalaxyViewport.test.ts
```

**Type-check without building:**
```bash
npx tsc -p tsconfig.app.json --noEmit      # app sources
npx tsc -p tsconfig.vitest.json --noEmit   # test sources
```

Tests live in both `src/**/*.test.{ts,tsx}` (co-located) and the top-level `tests/` directory for standalone benchmarks. `vitest.config.ts` only scans `src/` for tests; benchmarks use the `tests/` include.

## Environment variables

Copy `.env` for local dev — it already sets `VITE_ENABLE_STATE_TEST=true`. Production builds need:

| Variable | Purpose |
|---|---|
| `VITE_BASE_URL` | Router basename and Vite `base`; required for non-dev builds |
| `VITE_API_URL` | Backend origin; falls back to `https://roguewar.org` |
| `VITE_ENABLE_STATE_TEST` | Enables dev-state injection (also on in DEV mode) |

## Architecture

The app is a single-page interactive war map for the RogueTech BattleTech mod. It fetches live game data (star systems, factions) from the `roguewar.org` API and renders thousands of nodes on a `react-konva` canvas.

### Data flow

```
useWarmapAPI          — raw fetch + runtime validation of API responses
  └─ useFiltering     — joins rawSystems with faction data → DisplayStarSystemType[]
       └─ GalaxyMap   — top-level page: loading/error gates, 5-min polling interval
            └─ GalaxyMapRender — canvas layout, viewport, interactions
```

**`GalaxyMap` (page)** boots the data hooks and gates rendering behind `isLoading`/`fetchError`. System data refreshes every 5 minutes via `setInterval`; faction data is fetched once.

**`GalaxyMapRender`** is the heavy component. It:
- Owns `useGalaxyViewport` (pan/zoom state), `usePinchZoom` (touch), `useTooltip`, and `useFiltering`'s derived state
- Culls `visibleSystems` per-frame by computing viewport bounds in world space before passing them to `<StarSystem>` nodes
- Renders three `<Layer>`s: background image, star system nodes, tooltip overlay

### Key types (`src/components/hooks/types/`)

- **`StarSystemType`** — raw API shape: `name`, `posX/posY`, `owner`, `factions: ControlInfo[]`, optional `state: StarSystemState`
- **`DisplayStarSystemType`** — projected form with `id`, `isCapital`, `factionColour`, `factionName`, `normalizedName` added by `useFiltering`
- **`FactionDataType`** — `Record<string, FactionType>` keyed by faction ID; `FactionType` carries `colour`, `prettyName`, optional `capital`
- **`StarSystemState`** — optional event flags: `isInsurrect`, `hasPirateRaid`, `hasCaptureEvent`, `hasHoldTheLineEvent`

### Performance patterns

`StarSystem` is `memo()`-wrapped. Star sizes are kept constant relative to screen pixels at all zoom levels via an imperative scale-listener pattern: `useGalaxyViewport` maintains a `Set<(scale) => void>` that fires synchronously on every zoom so each group's Konva node is updated before the next `batchDraw`, avoiding per-system React re-renders on zoom.

The viewport culls systems outside the visible world-space rectangle before rendering — this is the primary render budget control for large system counts.

### Dev-state injection (`src/components/helpers/devStateInjector.ts`)

Active in `DEV` mode or when `VITE_ENABLE_STATE_TEST=true`. Controlled via URL params (`?stateTest=1&statePreset=dense`) or `localStorage` keys. Injects `StarSystemState` event flags onto specific named systems for visual testing without hitting the real API. Named presets (`sample`, `dense`) or a custom `StateOverrideMap` stored in `localStorage` (`warMapDevStateOverrides`) are all supported.

### Git hooks

`simple-git-hooks` manages two hooks (registered by `yarn install`):
- **pre-commit**: ESLint + JSON syntax validation of staged `.json` files (excluding `tsconfig*.json`)
- **pre-push**: `tsc --noEmit` + full test suite

CI (`.github/workflows/test.yml`) runs lint, both typechecks, and `test:coverage` on Node 20 and 22 for every push/PR to `main`.
