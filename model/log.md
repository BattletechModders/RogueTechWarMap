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
  to `jsdom`, register a `src/test/setup.ts` setup file, and widen `include`
  to pick up both legacy `tests/**/*.test.{ts,tsx}` and the new adjacent
  `src/**/*.test.{ts,tsx}` pattern. Created `src/test/setup.ts` to import
  `@testing-library/jest-dom/vitest`, run `cleanup()` after each test, and
  polyfill `matchMedia` + `ResizeObserver` for libraries that touch them.
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

- **Verification:** `yarn test` runs the three pre-existing test files
  (`gm.types`, `gm.selectors`, `gm.interactions`) under the new configuration
  with all 11 assertions passing. This establishes a green baseline before
  adding new suites.

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
     three near-identical copies (`App`, `StarSystem`, `GalaxyMap`, `main`,
     pages barrel), so any future fix would need to be applied in parallel.
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
  `useImperativeHandle` means StarSystem's useEffect animations can call
  `pulseNode.scale(...)` without a `getLayer is not a function` TypeError —
  critical for the "smoke test mounts cleanly" guarantee.

### 8. Authoring strategy per audit tier

- **Pure utilities:** authored one suite per source file with positive-path,
  edge-case (empty input, missing key, falsy values, case sensitivity), and
  contract tests (shape conformance, type-level assertions).
- **Hooks:** used RTL's `renderHook` + `act` for state hooks; mocked `fetch`
  via `vi.stubGlobal` for the API hooks; faked rAF and `performance.now`
  with a queue + controllable clock for viewport/pinch hooks to assert both
  throttle and frame-coalescing behavior deterministically.
- **Components:**
  - `PageTemplate`, `SideMenu`, `Home`, `ToS`, `Error` use `MemoryRouter`
    / `createMemoryRouter` to exercise all three `ErrorPage` branches (route
    error response, thrown `Error`, non-Error).
  - `BottomFilterPanel` drives the toggle chevron, search input, and help
    tooltip via `fireEvent`/`userEvent`, and simulates a mobile viewport by
    rewriting `window.innerWidth` so the click-to-toggle tooltip path is hit.
  - `StarSystem`, `GalaxyMap`, `App`, and `main` use the shared Konva mock
    and stub fetch to exercise the component/page/bootstrap surface without
    requiring a real canvas. `main.test.tsx` wraps `createRoot` to assert
    that bootstrap actually attaches to the supplied `#react-root` element.

### 9. Final rig verification

- **Action taken:** Ran `yarn test` (`vitest run`) — the full suite reports
  **29 test files / 122 tests passing**. Also ran `npx tsc -p
  tsconfig.vitest.json --noEmit` (clean) and `yarn build` (production build
  succeeds with the same output as before the test work).
- **Alternatives considered:**
  1. *Only run `yarn test`.* Rejected — a type-clean but untested config
     slippage is exactly the sort of silent regression the rig is supposed
     to prevent.
  2. *Also run `yarn lint`.* Noted as reasonable for a follow-up but skipped
     here: ESLint config is outside the test-rig scope and the existing
     codebase warns about some pre-existing issues unrelated to this work.
- **Reasoning:** `test` + `tsc --noEmit` + `build` covers the three
  orthogonal failure modes (runtime assertions, type safety, production
  bundling). All three are green, which satisfies the CLAUDE.md "must load
  correctly and provide standard, readable output" bar.

#### Final coverage map

| File                                                  | Adjacent test                                       | Depth |
| ----------------------------------------------------- | --------------------------------------------------- | ----- |
| `src/App.tsx`                                         | `src/App.test.tsx`                                  | smoke |
| `src/main.tsx`                                        | `src/main.test.tsx`                                 | smoke |
| `src/components/core/PageTemplate.tsx`                | `…/PageTemplate.test.tsx`                           | deep  |
| `src/components/core/SideMenu.tsx`                    | `…/SideMenu.test.tsx`                               | deep  |
| `src/components/GalaxyMap/gm.interactions.ts`         | `…/gm.interactions.test.ts`                         | deep  |
| `src/components/GalaxyMap/gm.selectors.ts`            | `…/gm.selectors.test.ts`                            | deep  |
| `src/components/GalaxyMap/gm.types.ts`                | `…/gm.types.test.ts`                                | deep  |
| `src/components/helpers/ApiHelper.ts`                 | `…/ApiHelper.test.ts`                               | deep  |
| `src/components/helpers/CapitalHelper.ts`             | `…/CapitalHelper.test.ts`                           | deep  |
| `src/components/helpers/devStateInjector.ts`          | `…/devStateInjector.test.ts`                        | deep  |
| `src/components/helpers/FactionHelper.ts`             | `…/FactionHelper.test.ts`                           | deep  |
| `src/components/helpers/index.ts`                     | `…/index.test.ts`                                   | deep  |
| `src/components/helpers/NewTabHelper.ts`              | `…/NewTabHelper.test.ts`                            | deep  |
| `src/components/helpers/RouteHelper.ts`               | `…/RouteHelper.test.ts`                             | deep  |
| `src/components/hooks/types/Settings.ts`              | `…/types/Settings.test.ts`                          | deep  |
| `src/components/hooks/types/index.ts`                 | `…/types/index.test.ts` (covers all 7 type files)   | deep  |
| `src/components/hooks/useFiltering.ts`                | `…/useFiltering.test.ts`                            | deep  |
| `src/components/hooks/useGalaxyViewport.ts`           | `…/useGalaxyViewport.test.ts`                       | deep  |
| `src/components/hooks/usePinchZoom.ts`                | `…/usePinchZoom.test.ts`                            | deep  |
| `src/components/hooks/useSettings.ts`                 | `…/useSettings.test.ts`                             | deep  |
| `src/components/hooks/useTooltip.ts`                  | `…/useTooltip.test.ts`                              | deep  |
| `src/components/hooks/useWarmapAPI.ts`                | `…/useWarmapAPI.test.ts`                            | deep  |
| `src/components/pages/Error.tsx`                      | `…/Error.test.tsx`                                  | deep  |
| `src/components/pages/GalaxyMap.tsx`                  | `…/GalaxyMap.test.tsx`                              | smoke |
| `src/components/pages/Home.tsx`                       | `…/Home.test.tsx`                                   | deep  |
| `src/components/pages/index.ts`                       | `…/index.test.ts`                                   | deep  |
| `src/components/pages/ToS.tsx`                        | `…/ToS.test.tsx`                                    | deep  |
| `src/components/ui/BottomFilterPanel.tsx`             | `…/BottomFilterPanel.test.tsx`                      | deep  |
| `src/components/ui/StarSystem.tsx`                    | `…/StarSystem.test.tsx`                             | smoke |

"Deep" means meaningful behavior / state / DOM assertions; "smoke" means the
component mounts cleanly under mocks with a small number of structural
assertions — the documented Option B posture.

### 10. Coverage reporter (`@vitest/coverage-v8`)

- **Action taken:** Installed `@vitest/coverage-v8@4.0.8` (pinned to match
  `vitest@4.0.8` exactly), configured the reporter inside `vitest.config.ts`
  with `provider: 'v8'`, text + html + lcov outputs, `reportsDirectory:
  './coverage'`, `include: ['src/**/*.{ts,tsx}']`, and excludes for test
  files, the `src/test/**` rig directory, and `src/vite-env.d.ts`. Added
  `coverage/` to `.gitignore` so generated reports are not committed. The
  `test:coverage` npm script (already present) now produces real numbers.
- **Alternatives considered:**
  1. *Use `@vitest/coverage-istanbul` instead.* Rejected: v8 is faster, has
     zero transform cost in watch mode, and is the default Vitest recommends.
     Istanbul only wins when you need legacy-browser coverage semantics that
     are irrelevant in this node/jsdom context.
  2. *Leave `coverage/` uncomitted but not in `.gitignore`.* Rejected — every
     local `yarn test:coverage` run would dirty the working tree and show
     dozens of generated HTML/CSS assets as untracked. `.gitignore` is the
     conventional answer.
  3. *Accept the latest `@vitest/coverage-v8@4.1.5`.* Rejected: v4.1.x
     imports `BaseCoverageProvider` from `vitest/node`, which v4.0.8 does
     not export. A version mismatch surfaces as an unhandled import error on
     every coverage run. Pinning both packages to the exact same minor
     resolves it.
- **Reasoning:** The `test:coverage` script existed as an alias for
  `vitest run --coverage` but without the reporter installed, it failed with
  a cryptic missing-provider error. Wiring v8 gives reviewers real numbers
  without costing dev-mode performance.

- **Initial report (after this change):** All files `73.9% stmts / 61.21%
  branches / 70.52% funcs / 76.75% lines`. Deep-tested modules (helpers,
  most hooks, Error / Home / ToS / PageTemplate / SideMenu pages) land at
  100%. The Option-B smoke targets (`GalaxyMap.tsx`, `StarSystem.tsx`,
  `usePinchZoom.ts`) are the sources of the un-green lines; that matches the
  documented posture. Type-only files (`ControlInfo.ts`, `StarSystemType.ts`,
  etc.) and re-export barrels (`helpers/index.ts`, `pages/index.ts`,
  `hooks/types/index.ts`) report as 0/0 because v8 cannot see them as having
  executable code — this is a cosmetic display quirk, not a real gap.

### 11. GitHub Actions CI workflow

- **Action taken:** Added `.github/workflows/test.yml`. The workflow triggers
  on `push` to `main` or `test-platform` and on any `pull_request` targeting
  `main`. It checks out the repo, installs Node (matrix of 20 + 22) with
  yarn caching via `actions/setup-node@v4`, runs `yarn install
  --frozen-lockfile`, typechecks the test sources with `npx tsc -p
  tsconfig.vitest.json --noEmit`, runs `yarn test:coverage`, and uploads
  the `coverage/` directory as a 14-day retained artifact from the Node 20
  leg only.
- **Alternatives considered:**
  1. *Single-version matrix (Node 20 only).* Rejected: running both 20 and
     22 surfaces version-drift issues early at negligible cost given yarn
     caching.
  2. *Use npm instead of yarn in CI.* Rejected — project uses yarn 1 and
     ships a `yarn.lock` pinned by the `packageManager` field; swapping
     lockfile tools creates drift risk.
  3. *Post coverage to Codecov via `codecov/codecov-action`.* Deferred —
     requires a repo-scoped secret (`CODECOV_TOKEN`) the maintainers would
     have to provision. Artifact upload gives reviewers the same HTML
     report without external dependencies; Codecov can be added later.
  4. *Skip the `tsc --noEmit` step.* Rejected: a vitest green run does not
     catch type regressions in test files themselves, and TypeScript
     misalignments in tests have bitten this project's type assertions
     before (the `expectTypeOf` suites).
- **Reasoning:** Three orthogonal failure modes — install reproducibility,
  type safety of tests, and runtime assertions — each get a step. The
  matrix covers the two supported LTS lines. The coverage artifact makes
  reviewer inspection a click rather than a local run.

- **Note:** GitHub Actions run against the PR's *base repository* config,
  so the workflow only becomes active for PR checks on
  `BattletechModders/RogueTechWarMap` once this PR merges into `main`.
  Until then, pushes to `nx-thaddeusaid/RogueTechWarMap:test-platform` will
  still trigger runs in the fork's own Actions (if enabled), which serves
  as a pre-merge smoke.

### 12. Extracting inline map helpers for deep coverage

- **Action taken:** Moved the inline helpers from `GalaxyMap.tsx` and
  `StarSystem.tsx` into two adjacent modules that are importable by tests:
  - `src/components/pages/GalaxyMap.helpers.ts` — `getViewportSize`,
    `getTooltipFontSize`, `getDesktopLineSegments(line, index, {
    titleFontSize, bodyFontSize })`, and `parseMobileTooltipData(text)`.
  - `src/components/ui/StarSystem.helpers.ts` — `buildControlItems`,
    `formatControlLine`, `formatSystemState`, `formatDamageLevel`, and
    `buildTooltipText({ system, factions, includeTapHint })`.
  Rewired `GalaxyMap.tsx` and `StarSystem.tsx` to call the extracted
  helpers (the component now wraps `getDesktopLineSegments` in a small
  `segmentsFor` closure so it keeps its previous zero-argument call shape
  at the two Konva call sites, and `buildTooltipText` is invoked with the
  explicit `{ system, factions }` object). Added 31 deep adjacent tests
  across `StarSystem.helpers.test.ts` (18) and `GalaxyMap.helpers.test.ts`
  (13) covering positive paths, edge cases (empty inputs, undefined state,
  whitespace-only damage level), ordering guarantees, the Owner/Damage
  label-split branch, and the mobile-tooltip parser's control-block
  skipping semantics.
- **Alternatives considered:**
  1. *Leave the helpers inline and write DOM-level assertions against the
     rendered tooltip text.* Rejected — asserting multi-line `\n`-joined
     tooltip strings via the Konva mock is indirect and brittle; a unit
     test against the pure function is clearer and cheaper to maintain.
  2. *Extract into a single shared `tooltip.helpers.ts` used by both the
     map page and the star-system node.* Rejected — the two call sites
     have different responsibilities (desktop tooltip-layout parsing vs.
     tooltip text composition) and a shared module would leak concerns;
     keeping them adjacent to the component that owns them matches the
     rest of the repository's file layout.
  3. *Re-export the helpers from the components themselves for tests.*
     Rejected because that couples production exports to test needs and
     complicates tree-shaking.
- **Reasoning:** Pure helpers live outside the Konva render tree, so they
  are testable under jsdom without any canvas or mock scaffolding. Moving
  them into their own modules took GalaxyMap.tsx from 72% / 40% / 58% /
  74% to 79% / 48% / 59% / 82% and upgraded `GalaxyMap.helpers.ts` to
  94.87% stmts / 88.46% branches / 100% funcs / 94.87% lines, while
  `StarSystem.helpers.ts` lands at 100% across the board. Overall project
  coverage moved from 73.9% / 61.21% / 70.52% / 76.75% to **79.22% /
  69.5% / 76.16% / 82.43%** (stmts / branches / funcs / lines), and the
  test count grew from 122 to 153 across 31 files, all green.

  The remaining untested lines concentrate where Option B expected them:
  inside the Konva rendering bodies of `GalaxyMap.tsx` and
  `StarSystem.tsx`, the pinch-gesture math in `usePinchZoom.ts`, and the
  inline height-animation setup in `BottomFilterPanel.tsx`. Lifting those
  would require a real canvas polyfill or component-level interaction
  tests, which remain out of scope for this rig.

