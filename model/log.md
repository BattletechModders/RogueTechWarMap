# Test Platform Decision Log

This log captures every significant decision made while standing up the
`test-platform` branch's Vitest-based test rig and its accompanying tests.
Each entry records the action taken, the alternatives considered, and the
reasoning behind the chosen path.

---

## 2026-04-22 — Session kickoff

### 1. Branch creation strategy

- **Action taken:** Created the `test-platform` branch from the mandated base
  commit `aca800c1d19cd842f872239dc16e8a1c5051bfa2` via
  `git checkout -b test-platform aca800c...`. The `CLAUDE.md` instruction file
  was carried forward as a staged addition so the session-level instructions
  persist on the new branch.
- **Alternatives considered:**
  1. Reset `main` in place to the base commit. Rejected because it rewrites the
     published `main` history and destroys the three security-patch commits
     that already shipped.
  2. Branch from the current `main` tip. Rejected because the CLAUDE.md brief
     explicitly pins the base commit — branching later would silently pull in
     post-base changes.
  3. Stash `CLAUDE.md`, checkout, unstash. Rejected because since `CLAUDE.md`
     does not exist in either end of the checkout, the ordinary checkout
     already carries the staged add forward cleanly — stash/unstash adds noise
     with no benefit.
- **Reasoning:** The direct `checkout -b <base>` matches the branding contract
  of "branch from this exact commit" while preserving the in-flight
  instructions file. It is reversible (main untouched) and auditable.

### 2. Initial repository audit

- **Action taken:** Enumerated every source file under `src/**` and inspected
  each one to classify its test surface. See "Audit inventory" below.
- **Alternatives considered:**
  1. Infer coverage from the existing `tests/**` directory only. Rejected
     because CLAUDE.md demands full coverage of "all functionality currently
     present in the repository" — the existing three tests cover a sliver.
  2. Delegate the entire audit to an Explore subagent. Rejected because the
     test-writing phase needs the concrete file contents in hand; reading
     directly keeps context consolidated.
- **Reasoning:** Writing good tests requires direct knowledge of each module's
  public surface and side effects; batch-reading produced that picture in one
  pass.

#### Audit inventory

Grouped by test strategy. Every listed symbol needs coverage on this branch.

**A. Pure utility modules (node-safe unit tests):**

| Module                                                   | Public surface                                           |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `src/components/helpers/ApiHelper.ts`                    | `API_BASE_URL` (env-derived with fallback)               |
| `src/components/helpers/RouteHelper.ts`                  | `BASE_ROUTE` (env-derived with fallback)                 |
| `src/components/helpers/CapitalHelper.ts`                | `isCapital(systemName, capitals)`                        |
| `src/components/helpers/FactionHelper.ts`                | `findFaction(factionKey, factions)`                      |
| `src/components/helpers/NewTabHelper.ts`                 | `openInNewTab(url)` (wraps `window.open`)                |
| `src/components/helpers/index.ts`                        | Barrel — exports the three above                         |
| `src/components/helpers/devStateInjector.ts`             | `applyDevStateInjection(systems)` (env + localStorage)   |
| `src/components/GalaxyMap/gm.interactions.ts`            | `getDistance(touch1, touch2)` *(covered by existing test)* |
| `src/components/GalaxyMap/gm.selectors.ts`               | `buildFactionFilterOptions(systems, factions)` *(covered)* |
| `src/components/GalaxyMap/gm.types.ts`                   | Type-only module *(covered via `expectTypeOf`)*          |
| `src/components/hooks/types/Settings.ts`                 | `initialSettings` runtime default                        |
| `src/components/hooks/types/index.ts`                    | Barrel (type re-exports + `initialSettings`)             |

**B. React hooks (need `renderHook`, jsdom):**

| Hook                                                     | Surface                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `src/components/hooks/useSettings.ts`                    | `{ settings, setFlashActive }`                            |
| `src/components/hooks/useTooltip.ts`                     | `{ tooltip, showTooltip, hideTooltip }`                   |
| `src/components/hooks/useWarmapAPI.ts`                   | `rawSystems/factions/capitals` + two fetchers             |
| `src/components/hooks/useFiltering.ts`                   | Composes `useWarmapAPI` + `useSettings`                   |
| `src/components/hooks/useGalaxyViewport.ts`              | Camera handlers (needs Konva stub)                        |
| `src/components/hooks/usePinchZoom.ts`                   | Touch handlers (needs Konva stub + RAF)                   |

**C. React components (need jsdom + RTL; Konva/react-router mocks):**

| Component                                                | Nature                                                    |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `src/App.tsx`                                            | Wires the router                                          |
| `src/main.tsx`                                           | Bootstrap (smoke only)                                    |
| `src/components/core/PageTemplate.tsx`                   | Layout shell                                              |
| `src/components/core/SideMenu.tsx`                       | Nav links                                                 |
| `src/components/pages/Error.tsx`                         | Route-error boundary                                      |
| `src/components/pages/Home.tsx`                          | Static content + `HomeCard`                               |
| `src/components/pages/ToS.tsx`                           | Static content + `BulletPoint`                            |
| `src/components/pages/GalaxyMap.tsx`                     | Konva-heavy map + tooltip                                 |
| `src/components/ui/BottomFilterPanel.tsx`                | Search + faction multi-select                             |
| `src/components/ui/StarSystem.tsx`                       | Konva primitive renderer                                  |
| `src/components/pages/index.ts`                          | Barrel re-exports                                         |

### 3. Test scope strategy

- **Action taken:** Chose "Option B — Deep coverage on testable surface, smoke
  on Konva." Every audited file gets at least one meaningful test; Konva-heavy
  render paths (`GalaxyMap.tsx` render tree, `StarSystem.tsx`,
  `useGalaxyViewport`, `usePinchZoom`) receive smoke-level coverage behind
  mocks rather than full canvas assertions.
- **Alternatives considered:**
  1. *Option A — Uniform smoke tests across everything.* Rejected as
     information-light: Konva smoke tests mainly validate that mocks were
     wired, not code behavior, so they do not repay the effort.
  2. *Option C — Skip Konva components entirely.* Rejected because CLAUDE.md
     mandates coverage of *all* functionality currently present.
- **Reasoning:** Option B is the highest-confidence-per-effort strategy. Tests
  concentrate where assertions are load-bearing (pure logic, state hooks,
  interactive DOM components) while still honoring the "all files tested"
  contract. Canvas math is inherently hostile to jsdom; meaningful coverage
  there would require a second-pass investment outside this session's budget.

### 4. Testing framework extension — RTL + jsdom

- **Action taken:** Added dev dependencies `@testing-library/react@16`,
  `@testing-library/dom@10`, `@testing-library/jest-dom@6`,
  `@testing-library/user-event@14`, and `jsdom@29` via `yarn add -D`. Rewrote
  `vitest.config.ts` to load `@vitejs/plugin-react-swc`, pin the environment
  to `jsdom`, register a `src/test/setup.ts` setup file, and set `include` to
  `src/**/*.test.{ts,tsx}` (adjacent-only). Created `src/test/setup.ts` to
  import `@testing-library/jest-dom/vitest`, run `cleanup()` after each test,
  and polyfill `matchMedia` + `ResizeObserver` for libraries that touch them.
  Updated `tsconfig.vitest.json` to extend `tsconfig.app.json` (so DOM libs
  are visible), pull in `vitest/globals` + `@testing-library/jest-dom` types,
  and include the new `src/**/*.test.{ts,tsx}` and `src/test/**/*` paths.
  Added `test`, `test:watch`, and `test:coverage` npm scripts.
- **Alternatives considered:**
  1. *Single `environment: 'node'` kept as-is; per-file `/// @vitest-environment jsdom`.*
     Rejected because it forces every component test file to carry a pragma
     and makes it easy to forget, leading to mysterious `window is undefined`
     failures.
  2. *Vitest `projects` / `environmentMatchGlobs` split.* Rejected as premature
     complexity — the `node` tests work fine under jsdom and the session's
     scope does not need two parallel runners.
  3. *Drop the stand-alone `tsconfig.vitest.json` and fold test includes into
     `tsconfig.app.json`.* Rejected because `tsconfig.app.json` deliberately
     excludes test files from production type-checking; keeping them
     separated preserves that.
  4. *Install `@testing-library/react@15` (peer on legacy API)* instead of
     `v16`. Rejected because `v16` ships React 18/19 support out of the box;
     we already run React 18.3.
- **Reasoning:** A single global jsdom environment is the lowest-friction
  configuration that still lets node-style tests pass, and matches the
  out-of-the-box conventions most React teams recognize as "industry
  standard." Keeping a dedicated `tsconfig.vitest.json` avoids polluting the
  app build surface with vitest globals.

### 5. localStorage polyfill in the test setup

- **Action taken:** Added a Map-backed `Storage` polyfill to
  `src/test/setup.ts`, installed on `window.localStorage` and
  `window.sessionStorage` whenever the existing object lacks `setItem`. A
  `beforeEach` hook clears both stores so tests are isolated.
- **Alternatives considered:**
  1. *Rely on jsdom's native storage.* Rejected: Vitest 4 / Node 25 stubs
     `window.localStorage` to a property-less empty object (a probe showed
     `ls.clear`, `ls.setItem`, `ls.removeItem` all `undefined`), with a noisy
     `--localstorage-file was provided without a valid path` warning.
  2. *Pass `--localstorage-file` or configure Node's experimental localStorage
     backing file.* Rejected as heavy and environment-specific; ties the rig
     to Node 25's experimental flag.
  3. *Use `vi.stubGlobal('localStorage', fake)` per test.* Rejected because
     several modules under test (devStateInjector, useWarmapAPI consumers)
     read `window.localStorage` at runtime, so a setup-file polyfill is less
     error-prone than remembering to stub per-file.
- **Reasoning:** A deterministic, Map-backed polyfill restores Web Storage
  semantics for all tests with one line of setup — matching the "industry
  standard" experience devs expect from jsdom.

### 6. Relocating the pre-existing tests to sit adjacent to source

- **Action taken:** Moved `tests/gm.interactions.test.ts`,
  `tests/gm.selectors.test.ts`, and `tests/gm.types.test.ts` to live next to
  their source files under `src/components/GalaxyMap/` (using relative imports
  like `./gm.interactions`). The now-empty `tests/` directory was removed and
  `tests/**/*` was dropped from both `vitest.config.ts`'s `include` and
  `tsconfig.vitest.json`'s `include`.
- **Alternatives considered:**
  1. *Keep the legacy `tests/` directory alongside new adjacent tests.*
     Rejected because CLAUDE.md mandates adjacent placement for all test
     files and a mixed strategy invites drift.
  2. *Leave old tests in place and only add new adjacent tests.* Rejected for
     the same reason.
- **Reasoning:** Consistency makes the project discoverable (each source file
  has a predictable test neighbor). Each relocation preserved all original
  assertions and gained a few extra cases (case-sensitive sort, empty list,
  negative coordinates, new type aliases) while reshaping the imports to the
  adjacent relative form.

### 7. Shared Konva mock module

- **Action taken:** Introduced `src/test/konvaMocks.tsx` exporting
  `reactKonvaStubs` (a set of `forwardRef` components for `Stage`, `Layer`,
  `Image`, `Text`, `Group`, `Rect`, `Line`, `Circle`) and `konvaStub` (a
  `default` namespace with stub `Animation` and `Text` classes). Each mocked
  react-konva primitive uses `useImperativeHandle` to return a fake node
  exposing the methods callers touch in `useEffect` (`opacity`, `scale`,
  `getLayer`, `getStage`, `container`, `batchDraw`, `getPosition`,
  `getPointerPosition`, `getRelativePointerPosition`, `x`, `y`, `scaleX`,
  `destroy`). Scalar props are forwarded to the DOM as `data-*` attributes
  so test assertions can still locate them.
- **Alternatives considered:**
  1. *Inline the mock inside each test file.* Rejected: we would end up with
     several near-identical copies across the Konva consumers, so any
     future fix would need to be applied in parallel.
  2. *Mock `konva` and `react-konva` globally in `src/test/setup.ts`.*
     Rejected because `vi.mock` is hoisted per-file at parse time — putting
     it in setup doesn't hoist into other test modules — and globally mocking
     Konva would block anyone who wants to write a canvas-enabled integration
     test later.
  3. *Install `jest-canvas-mock` / `canvas` polyfill so real Konva can run
     under jsdom.* Rejected because Option B explicitly aimed for smoke
     coverage; pulling in a canvas shim is a second-pass investment.
- **Reasoning:** A shared mock minimizes duplication while staying per-file
  (`vi.mock` still hoists from each consumer). Exposing methods via
  `useImperativeHandle` means Konva-consuming effects can call
  `pulseNode.scale(...)` without a `getLayer is not a function` TypeError —
  critical for the "smoke test mounts cleanly" guarantee.

- **Verification at this point:** With only the three relocated `gm.*` test
  files as content, `yarn test` reports 3 files / 11 tests passing. The rig
  is ready to host the new adjacent suites.
