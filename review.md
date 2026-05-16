# Code Review: `system-state` branch

## Overview

This branch has two major feature areas and significant structural refactoring:

1. **System state visualization** — new `StarSystemState` type carrying insurrection, pirate raid, capture event, and hold-the-line flags, with per-system graphical effects (glow rings, animated pulses, icon overlays)
2. **Viewport architecture overhaul** — zoom/pan extracted into `useGalaxyViewport`, pinch-to-zoom into `usePinchZoom`, mobile tooltip moved from Konva canvas into DOM, viewport culling added, desktop tooltip rebuilt with canvas text measurement

Supporting work: `devStateInjector.ts` for dev testing, new unit tests, `normalizedName` field, `useDeferredValue` for search.

---

## Positive highlights

- **Hook extraction is clean.** `useGalaxyViewport` and `usePinchZoom` are focused and well-typed. The shared ref pattern (`scaleRef`, `positionRef`) correctly avoids stale-closure issues while keeping the Konva interaction path off the React render cycle.
- **Viewport culling (`visibleSystems`)** is the right move. Filtering to only render on-screen systems before passing to Konva is a substantial win for large maps.
- **`useDeferredValue` for search** is a correct React 18 pattern — low-priority updates won't block the map interaction.
- **`normalizedName` computed once at the data layer** is better than calling `.toLowerCase()` inside every filter pass.
- **Mobile tooltip in DOM** (rather than a Konva `Label`) is the right call: proper text reflow, scroll for long content, accessible.
- **`devStateInjector`** is well-gated (`import.meta.env.DEV`), supports multiple presets, localStorage overrides, and won't reach production.
- **Background image error handling** (`bgLoadError`) and `stage.container` type guard are good defensive additions.

---

## Issues and suggestions

### Bugs / correctness

**1. `setZoomScaleFactor` missing from `usePinchZoom.onTouchMove` — scale factor not updated during pinch**

`onTouchMove` updates `scaleRef.current` and the Konva stage directly but never calls `setZoomScaleFactor`, so `zoomScaleFactor` stays stale during the pinch gesture. The `zoomScaleFactor` drives system dot sizing, so stars won't resize mid-pinch. The call only happens in `onTouchEnd`. Additionally, `setZoomScaleFactor` is listed in the `onTouchMove` dep array but never actually called there.

```ts
// usePinchZoom.ts — inside the rAF callback in onTouchMove, add:
setZoomScaleFactor(newScale);
```

**2. `useGalaxyViewport` accesses `window` at init time with no guard**

```ts
const positionRef = useRef<Point>({
  x: window.innerWidth / 2,  // line ~27 — crashes in SSR / test environments
  y: window.innerHeight / 2,
});
```

The rest of the file guards all `window` access, but this initializer runs unconditionally. Pair with the `getViewportSize()` helper already defined in `GalaxyMap.tsx`:

```ts
const initialSize = typeof window !== 'undefined'
  ? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  : { x: 0, y: 0 };
const positionRef = useRef<Point>(initialSize);
```

**3. `desktopTooltipLayout` useMemo has a stale closure on `getDesktopLineSegments`**

`getDesktopLineSegments` is defined inside the component and captures `desktopTitleFontSize` / `desktopBodyFontSize`. The useMemo lists `desktopTooltipLines` and `desktopLineHeight` as deps but not `getDesktopLineSegments`:

```ts
const desktopTooltipLayout = useMemo(() => {
  // calls getDesktopLineSegments(line, index) ...
}, [desktopTooltipLines, tooltipFontSize, desktopLineHeight]); // missing getDesktopLineSegments
```

Currently safe because font sizes aren't React state — but this will silently break if that changes. Either add `getDesktopLineSegments` to deps or extract it with `useCallback`.

**4. Insurrection animation restarts when icon images load**

`shouldPulseSize` effect depends on `[shouldPulseSize, pirateIconImage, holdTheLineIconImage, captureEventIconImage]`. When an image loads (triggering a re-render via `setState`), the animation stops mid-frame and restarts. The stopped frame leaves nodes at an intermediate animation state for one tick, causing a brief visual glitch. Consider tracking loaded images in a ref and only including the boolean flags in the animation effect deps.

---

### Performance concerns

**5. `visibleSystems` recomputes on every drag tick**

`visibleSystems` depends on `view`, which updates via `schedulePositionUpdate` (one rAF delay after each drag event). That's fine. However, `getViewportBounds` is defined inside the component body but outside `useMemo` — a new function reference every render. This doesn't cause a stale closure problem here, but it's unnecessary noise. Extract it to module scope (it has no component-level deps).

**6. `renderedSystems` key includes coordinates — ownership change forces full remount**

```tsx
key={`${system.name}-${system.posX}-${system.posY}-${system.owner}`}
```

Coordinates are effectively fixed per system, so including them is harmless. But the key also means that a faction ownership change forces a full unmount/remount of the `StarSystem` node, restarting all its Konva animations. If smoothly transitioning ownership changes ever matters, you'd want the key to be just `system.name`.

**7. Three near-identical icon loaders in `StarSystem.tsx`**

`loadPirateIconImage`, `loadHoldTheLineIconImage`, `loadCaptureEventIconImage` are identical modulo the URL and cache vars. A single generic factory reduces future maintenance burden:

```ts
const makeIconLoader = (url: string) => {
  let cache: HTMLImageElement | null = null;
  let promise: Promise<HTMLImageElement> | null = null;
  return () => { /* shared logic */ };
};
```

---

### Code quality / style

**8. `mobileTooltipData` parsing is fragile string-splitting on API text**

The memo parses the tooltip text string (which was originally built in `buildTooltipText`) by splitting on `\n` and pattern-matching for `Control:`, `Owner:`, etc. This means two representations of the same data exist: the structured `controlItems` array already present on `tooltip`, and the text blob. The mobile tooltip should consume `tooltip.controlItems` directly instead of re-parsing the string — you already pass `controlItems` to `showTooltip`, so they're available.

**9. `inControlBlock` logic in `mobileTooltipData` will silently drop data**

```ts
if (line === 'Control:') {
  inControlBlock = true;
  continue;
}
if (inControlBlock) {
  const isKeyValueLine = /^[A-Za-z ]+:\s/.test(line);
  if (!isKeyValueLine) continue;
  inControlBlock = false;
}
```

This skips all control percentage lines since they match `Faction Name 45% · P3` (no colon-value pattern). The intent is correct but the control block stripping depends on the exact text format from `buildTooltipText`. Directly using `tooltip.controlItems` (point 8 above) eliminates this entirely.

**10. Retained typo from `main`**

`settings.flashActivePlayes` (missing 'r') — already existed before this branch, but since `StarSystem.tsx` is being touched extensively, worth fixing now.

---

### Tests

The two new test files (`gm.interactions.test.ts`, `gm.selectors.test.ts`) cover `getDistance` and `buildFactionFilterOptions`. Good baseline. The hooks (`useGalaxyViewport`, `usePinchZoom`, `useTooltip`) and the `devStateInjector` have no tests. The injector in particular has branching logic worth unit-testing (`isTruthyFlag`, `isStateOverrideMap`, preset selection, named overrides).

---

## Summary

| Area | Status |
|---|---|
| Hook extraction | Clean |
| Viewport culling | Correct |
| System state visuals | Works, minor animation restart issue |
| `zoomScaleFactor` during pinch | Bug — not updated mid-gesture |
| SSR/window guard in `useGalaxyViewport` | Missing on init |
| Mobile tooltip data source | Should use `controlItems`, not re-parse text |
| Desktop tooltip stale closure | Low-risk now, will break if font size becomes state |
| Icon loader duplication | Minor DRY issue |
| Test coverage | Good for utilities, missing for hooks/injector |
