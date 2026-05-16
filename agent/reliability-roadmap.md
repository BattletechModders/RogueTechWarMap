# RogueTechWarMap — Reliability Roadmap

Goal: harden the application before and after the new season launch. Items are grouped by theme and ordered by priority within each group. Severity labels: **critical**, **high**, **medium**, **low**.

---

## 1. API & Data Layer

### 1.1 Enforce `res.ok` before calling `.json()` — **high**
**File:** `src/components/hooks/useWarmapAPI.ts`

Both `fetchFactionData` and `fetchSystemData` call `res.json()` unconditionally. A 4xx/5xx response will either throw an unhandled parse error or silently return an error body. Users see a blank map with no explanation.

Fix: check `if (!res.ok) throw new Error(...)` before `.json()`. Surface the error in UI state so the map shows a failure message instead of nothing.

### 1.2 Add a fetch timeout — **medium**
**File:** `src/components/hooks/useWarmapAPI.ts`

Bare `fetch()` waits forever if the server hangs. Use `AbortSignal.timeout(10_000)` (or an `AbortController`) to fail fast and let the retry interval recover.

### 1.3 Validate API response shape — **high**
**File:** `src/components/hooks/useWarmapAPI.ts`, `src/components/hooks/useFiltering.ts`

The code trusts the API to return exactly the expected shape. If `posX`/`posY` are missing, `Number(undefined)` silently produces `NaN` and systems render at the origin. If the factions object changes keys, colours and names break silently.

Fix: add lightweight runtime guards (check `Array.isArray`, required field presence) and log or surface a warning when the shape is wrong. A Zod schema is ideal but even manual guards are far better than nothing.

### 1.4 Show a loading / error state — **high**
**File:** `src/components/pages/GalaxyMap.tsx` (lines 78–94)

`GalaxyMap` returns `null` while data is loading. Users see a completely blank page. Add a loading indicator and a distinct error state when the fetch fails.

### 1.5 Handle missing capitals gracefully — **low**
**File:** `src/components/hooks/useWarmapAPI.ts` (lines 23–31)

If a faction's `capital` field doesn't match any system name, the capital is silently skipped. Add a dev-mode console warning so data mismatches are caught during testing.

---

## 2. Runtime Bugs

### 2.1 Guard against NaN scale in pinch zoom — **medium**
**File:** `src/components/hooks/usePinchZoom.ts` (around line 83)

If both touch points are at identical coordinates, `Math.hypot(0, 0) = 0`, and `lastDistance / 0 = Infinity` or `0 / 0 = NaN`. `Math.max(0.9, Math.min(1.1, NaN))` returns `NaN`, which propagates into `stage.scale()` and breaks rendering until refresh.

Fix: add `if (newDistance === 0) return;` before the scale calculation.

### 2.2 Fix `scaleRef.current || 1` null guard in useTooltip — **low**
**File:** `src/components/hooks/useTooltip.ts` (line 31)

`|| 1` treats scale `0` as falsy. Use `?? 1` (nullish coalescing) so only `null`/`undefined` falls back, not the value `0`.

### 2.3 Handle orientation change mid-pinch — **medium**
**File:** `src/components/pages/GalaxyMap.tsx` (lines 199–213), `src/components/hooks/usePinchZoom.ts`

A device rotation fires the `resize` handler and updates `stageSize`, but in-flight pinch samples still reference old screen coordinates. The next touch frame applies the transform to a mismatched canvas, causing the map to "teleport."

Fix: in `onTouchMove`, cancel any pending frame and reset `lastDistance.current = 0` when `stageSize` changes (pass a `stageSize` version counter into the hook so it can detect the change).

### 2.4 Tooltip not dismissed on pinch-to-single-touch transition — **medium**
**File:** `src/components/hooks/usePinchZoom.ts` (lines 44–60)

`hideTooltip()` is only called on `onTouchStart` with a single touch. If the user goes from two-finger pinch → lifts one finger → continues with single finger, the tooltip is never hidden because `onTouchStart` doesn't re-fire. Call `hideTooltip()` in `onTouchEnd` when dropping from two fingers to one.

---

## 3. Memory Leaks

### 3.1 Verify scale listener cleanup in StarSystem — **medium**
**File:** `src/components/ui/StarSystem.tsx`, `src/components/hooks/useGalaxyViewport.ts`

`registerScaleListener` returns an unsubscribe function. Confirm every `useEffect` that calls `registerScaleListener` returns the cleanup: `return unsubscribe`. A missing cleanup leaves dead listeners in the Set that fire on every zoom for the lifetime of the page.

### 3.2 Cancel icon-load promises on unmount — **medium**
**File:** `src/components/ui/StarSystem.tsx` (icon loading effects)

Each icon loader uses a `cancelled` flag. Confirm the flag is set in the `useEffect` cleanup (`return () => { cancelled = true; }`) and that the module-level image cache does not prevent cleanup from taking effect.

---

## 4. CI & Build Robustness

### 4.1 Add ESLint to CI — **high**
**File:** `.github/workflows/test.yml`

The `lint` script exists in `package.json` but is not called in CI. `eslint-plugin-react-hooks` catches stale closure bugs and missing dependency arrays automatically — these are exactly the category of bug found in this codebase. Add a `yarn lint` step before the test step.

### 4.2 Enforce type-checking in CI for all TS files — **medium**
**File:** `.github/workflows/test.yml`

The test workflow runs `tsc -p tsconfig.vitest.json --noEmit` but the main build uses `tsc -b` with the app tsconfig (which excludes test files). Add an explicit `tsc --noEmit` step that covers the full project so type errors in any file fail CI.

### 4.3 Add coverage thresholds — **medium**
**File:** `vitest.config.ts`

`yarn test:coverage` reports coverage but enforces no floor. Add a `thresholds` block (e.g. 70% line/function) so coverage regressions fail CI. Adjust the floor as coverage improves.

```ts
// vitest.config.ts — add inside coverage: {}
thresholds: {
  lines: 70,
  functions: 70,
},
```

### 4.4 Guard `VITE_BASE_URL` at build time — **medium**
**File:** `vite.config.ts` (line 8)

In production mode, `env.VITE_BASE_URL` is used as the base path. If the variable is unset, Vite uses `undefined` as the base, silently breaking all asset and route paths. Add a build-time check:

```ts
if (mode !== 'development' && !env.VITE_BASE_URL) {
  throw new Error('VITE_BASE_URL must be set for production builds');
}
```

---

## 5. Test Gaps

### 5.1 Test API error paths in useWarmapAPI — **high**
No test covers a non-ok response or a `.json()` parse failure. Add tests for:
- `res.ok = false` → error state is set, systems remain empty
- fetch throws (network failure) → same
- response body is malformed JSON → caught and surfaced

### 5.2 Test viewport culling boundary conditions — **medium**
**File:** `src/components/pages/GalaxyMap.helpers.ts` / `GalaxyMap.tsx`

`getViewportBounds` is tested for normal cases but not for:
- `stageSize.width = 0` or `height = 0` (returns infinite bounds — verify systems aren't all culled)
- `view.scale = 0` (division by zero → Infinity bounds)
- systems exactly on the edge (x === left, x === right)

### 5.3 Test gesture listener cleanup — **medium**
**File:** `src/components/pages/GalaxyMap.tsx` (lines 145–270)

Three separate `useEffect` blocks add document/window/container gesture listeners. No test verifies they are removed on unmount. Add a render + unmount test that spies on `removeEventListener` and asserts each registered listener is cleaned up.

### 5.4 Test pinch + wheel same-frame interaction — **medium**
**File:** `src/components/hooks/usePinchZoom.ts`, `src/components/hooks/useGalaxyViewport.ts`

No test covers simultaneous pinch and wheel events. At minimum test that firing both in the same frame doesn't corrupt `scaleRef` or `positionRef`.

### 5.5 Test `parseMobileTooltipData` edge cases — **low**
**File:** `src/components/pages/GalaxyMap.helpers.ts`

The state machine for skipping the "Control:" block is not tested for:
- `"Control:"` with no following lines
- `"Control:"` as the last line of the string
- Multiple `"Control:"` occurrences

### 5.6 Test BottomFilterPanel animation cleanup — **low**
**File:** `src/components/ui/BottomFilterPanel.tsx`

The `requestAnimationFrame`-based height animation is not tested for `panelRef.current === null` or rapid open/close toggling before the animation frame fires.

### 5.7 Test StarSystem icon animation lifecycle — **medium**
**File:** `src/components/ui/StarSystem.tsx`

Konva animation start/stop on mount/unmount is untested. Add tests that verify:
- Animation is started when a pirate raid / event condition is true
- Animation is stopped and cleaned up when the component unmounts
- Toggling the condition stops the previous animation before starting a new one

---

## 6. UX / Defensive Hardening

### 6.1 Passive event listener audit — **medium**
**File:** `src/components/pages/GalaxyMap.tsx` (lines 145–270)

Three layers of gesture-blocking listeners (document, window, stage container) may conflict with Konva's own listeners. Audit which ones are strictly necessary — redundant non-passive listeners cause browser performance warnings and can interfere with Konva's touch handling on Chrome.

### 6.2 Rapid filter / search debounce — **low**
**File:** `src/components/pages/GalaxyMap.tsx`

`useDeferredValue` is used for `searchTerm`, which is good. Verify that `selectedFactions` state changes (which re-run `visibleSystems` immediately) don't cause jank at high system counts. If needed, wrap faction filtering in `useDeferredValue` too.

---

## Prioritised Work Order

| Priority | Item | Effort |
|----------|------|--------|
| 1 | 1.1 — `res.ok` check + error surfacing | small |
| 2 | 1.4 — Loading/error UI state | small |
| 3 | 4.1 — ESLint in CI | trivial |
| 4 | 5.1 — API error path tests | medium |
| 5 | 1.3 — API response shape validation | medium |
| 6 | 4.3 — Coverage thresholds | trivial |
| 7 | 4.4 — `VITE_BASE_URL` build guard | trivial |
| 8 | 2.1 — NaN guard in pinch zoom | trivial |
| 9 | 2.4 — Tooltip on pinch→single-touch | small |
| 10 | 3.1 / 3.2 — Scale listener & icon cleanup audit | small |
| 11 | 5.2 — Viewport culling boundary tests | medium |
| 12 | 5.3 — Gesture listener cleanup tests | medium |
| 13 | 2.3 — Orientation change mid-pinch | medium |
| 14 | 1.2 — Fetch timeout | small |
| 15 | 4.2 — Full TS type-check in CI | small |
| 16 | Remaining medium/low items | — |
