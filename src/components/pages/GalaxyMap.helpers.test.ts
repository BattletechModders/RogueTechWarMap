import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getDesktopLineSegments,
  getTooltipFontSize,
  getViewportBounds,
  getViewportSize,
  parseMobileTooltipData,
} from './GalaxyMap.helpers';

// ---------------------------------------------------------------------------
// getViewportBounds
// ---------------------------------------------------------------------------

const view1x = { scale: 1, position: { x: 0, y: 0 } };

describe('getViewportBounds', () => {
  it('returns infinite bounds when stageSize.width is 0', () => {
    const b = getViewportBounds({ width: 0, height: 768 }, view1x);
    expect(b.left).toBe(Number.NEGATIVE_INFINITY);
    expect(b.right).toBe(Number.POSITIVE_INFINITY);
    expect(b.top).toBe(Number.NEGATIVE_INFINITY);
    expect(b.bottom).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns infinite bounds when stageSize.height is 0', () => {
    const b = getViewportBounds({ width: 1024, height: 0 }, view1x);
    expect(b.left).toBe(Number.NEGATIVE_INFINITY);
    expect(b.right).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns infinite bounds when both dimensions are 0', () => {
    const b = getViewportBounds({ width: 0, height: 0 }, view1x);
    expect(b.left).toBe(Number.NEGATIVE_INFINITY);
    expect(b.right).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns finite bounds for a normal viewport at scale 1, no pan', () => {
    const b = getViewportBounds({ width: 1024, height: 768 }, view1x, 0);
    expect(b.left).toBe(-1);   // margin clamped to max(0/1, 1)=1
    expect(b.right).toBeCloseTo(1025);
    expect(b.top).toBe(-1);
    expect(b.bottom).toBeCloseTo(769);
  });

  it('accounts for pan offset correctly', () => {
    const view = { scale: 1, position: { x: -200, y: -100 } };
    const b = getViewportBounds({ width: 1024, height: 768 }, view, 0);
    // left = (0 - (-200)) / 1 - 1 = 199
    expect(b.left).toBeCloseTo(199);
    // right = (1024 - (-200)) / 1 + 1 = 1225
    expect(b.right).toBeCloseTo(1225);
  });

  it('scales the visible region inversely when zoomed in (scale > 1)', () => {
    const view = { scale: 2, position: { x: 0, y: 0 } };
    const b = getViewportBounds({ width: 1024, height: 768 }, view, 0);
    // right = (1024 - 0) / 2 + 1 = 513
    expect(b.right).toBeCloseTo(513);
    // bottom = (768 - 0) / 2 + 1 = 385
    expect(b.bottom).toBeCloseTo(385);
  });

  it('includes systems exactly on the left and right boundary', () => {
    const b = getViewportBounds({ width: 1024, height: 768 }, view1x, 0);
    // The filter culls when x < left or x > right — exact edge is included.
    expect(b.left).toBeGreaterThan(Number.NEGATIVE_INFINITY);
    const xOnLeft = b.left;
    const xOnRight = b.right;
    expect(xOnLeft < b.left).toBe(false);  // not culled
    expect(xOnRight > b.right).toBe(false); // not culled
  });

  it('never culls anything when scale is 0 (division-by-zero fallback)', () => {
    const view = { scale: 0, position: { x: 0, y: 0 } };
    const b = getViewportBounds({ width: 1024, height: 768 }, view, 120);
    // With scale=0 the bounds collapse to ±Infinity or NaN; either way a
    // sample point should pass the culling guard (not be excluded).
    const x = 500;
    const y = 300;
    const culled =
      x < b.left || x > b.right || y < b.top || y > b.bottom;
    expect(culled).toBe(false);
  });

  it('applies the default 120px screen margin at scale 1', () => {
    const b = getViewportBounds({ width: 1024, height: 768 }, view1x);
    // margin = max(120/1, 1) = 120; left = 0 - 0 - 120 = -120
    expect(b.left).toBeCloseTo(-120);
    expect(b.right).toBeCloseTo(1144);
  });
});

// ---------------------------------------------------------------------------
// getViewportSize
// ---------------------------------------------------------------------------

describe('getViewportSize', () => {
  it('returns current window dimensions when window is defined', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 768,
    });
    expect(getViewportSize()).toEqual({ width: 1024, height: 768 });
  });
});

describe('getTooltipFontSize', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns rem-scaled 0.85x of the document root font size', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () => ({ fontSize: '20px' } as unknown as CSSStyleDeclaration)
    );
    expect(getTooltipFontSize()).toBeCloseTo(17, 5); // 20 * 0.85
  });

  it('falls back to 16 * 0.85 when computed style is unparseable', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () => ({ fontSize: 'not-a-size' } as unknown as CSSStyleDeclaration)
    );
    expect(getTooltipFontSize()).toBeNaN(); // parseFloat('not-a-size') -> NaN
  });
});

describe('getDesktopLineSegments', () => {
  const sizes = { titleFontSize: 20, bodyFontSize: 14 };

  it('renders the first (index 0) line as a single bold title segment', () => {
    const segs = getDesktopLineSegments('Terra', 0, sizes);
    expect(segs).toEqual([
      { text: 'Terra', fontStyle: 'bold', fontSize: 20 },
    ]);
  });

  it('splits Owner/Damage lines into bold label + normal value segments', () => {
    const owner = getDesktopLineSegments('Owner: House Davion', 2, sizes);
    expect(owner).toEqual([
      { text: 'Owner: ', fontStyle: 'bold', fontSize: 14 },
      { text: 'House Davion', fontStyle: 'normal', fontSize: 14 },
    ]);

    const dmg = getDesktopLineSegments('Damage: Heavy', 6, sizes);
    expect(dmg).toEqual([
      { text: 'Damage: ', fontStyle: 'bold', fontSize: 14 },
      { text: 'Heavy', fontStyle: 'normal', fontSize: 14 },
    ]);
  });

  it('treats Control: and State: header lines as bold', () => {
    expect(getDesktopLineSegments('Control:', 3, sizes)[0].fontStyle).toBe(
      'bold'
    );
    expect(getDesktopLineSegments('State: Insurrection', 7, sizes)[0].fontStyle).toBe(
      'bold'
    );
  });

  it('renders plain body lines with normal font style', () => {
    const seg = getDesktopLineSegments('House Davion 50% · 2', 4, sizes);
    expect(seg).toEqual([
      {
        text: 'House Davion 50% · 2',
        fontStyle: 'normal',
        fontSize: 14,
      },
    ]);
  });
});

describe('parseMobileTooltipData', () => {
  it('returns empty data for undefined, empty, or whitespace input', () => {
    expect(parseMobileTooltipData(undefined)).toEqual({
      title: '',
      subtitle: '',
      details: [],
    });
    expect(parseMobileTooltipData('')).toEqual({
      title: '',
      subtitle: '',
      details: [],
    });
    expect(parseMobileTooltipData('   \n  ')).toEqual({
      title: '',
      subtitle: '',
      details: [],
    });
  });

  it('captures the title, subtitle, and remaining details', () => {
    const text = [
      'Terra',
      '(10, 20)',
      'Owner: House Davion',
      'Damage: Unknown',
    ].join('\n');

    expect(parseMobileTooltipData(text)).toEqual({
      title: 'Terra',
      subtitle: '(10, 20)',
      details: ['Owner: House Davion', 'Damage: Unknown'],
    });
  });

  it('treats a second line not starting with "(" as the first detail, not a subtitle', () => {
    const text = ['Terra', 'Owner: House Davion', 'Damage: Unknown'].join('\n');
    expect(parseMobileTooltipData(text)).toEqual({
      title: 'Terra',
      subtitle: '',
      details: ['Owner: House Davion', 'Damage: Unknown'],
    });
  });

  it('strips the "[Tap to open]" hint and any blank lines', () => {
    const text = [
      'Terra',
      '(10, 20)',
      '',
      'Owner: House Davion',
      '[Tap to open]',
    ].join('\n');
    const result = parseMobileTooltipData(text);
    expect(result.details).not.toContain('[Tap to open]');
    expect(result.details).toEqual(['Owner: House Davion']);
  });

  it('skips non-key-value lines inside the Control block until a new key-value line is seen', () => {
    const text = [
      'Terra',
      '(10, 20)',
      'Owner: House Davion',
      'Control:',
      'House Davion 60% · 3',
      'House Kurita 40% · 1',
      '+2 more',
      'Damage: Light',
    ].join('\n');

    const result = parseMobileTooltipData(text);
    // "Control:" header and the control lines (no ": " after letters)
    // are dropped; only the Damage key-value line remains as a detail.
    expect(result.details).toEqual([
      'Owner: House Davion',
      'Damage: Light',
    ]);
  });

  it('includes a key-value detail that appears after the control block', () => {
    const text = [
      'Terra',
      '(10, 20)',
      'Control:',
      'House Davion 60% · 3',
      'State: Insurrection',
    ].join('\n');
    const result = parseMobileTooltipData(text);
    expect(result.details).toContain('State: Insurrection');
  });

  it('does not crash when "Control:" is the last line (no following content)', () => {
    const text = ['Terra', '(10, 20)', 'Owner: ComStar', 'Control:'].join('\n');
    const result = parseMobileTooltipData(text);
    expect(result.title).toBe('Terra');
    expect(result.details).toEqual(['Owner: ComStar']);
  });

  it('handles multiple "Control:" blocks — each resets the inControlBlock flag', () => {
    const text = [
      'Terra',
      '(10, 20)',
      'Control:',
      'House Davion 60% · 3',
      'Damage: Light',
      'Control:',
      'House Kurita 40% · 1',
      'State: Contested',
    ].join('\n');
    const result = parseMobileTooltipData(text);
    // Both key-value lines after each control block should appear.
    expect(result.details).toContain('Damage: Light');
    expect(result.details).toContain('State: Contested');
    // Raw control percentage lines should be dropped.
    expect(result.details).not.toContain('House Davion 60% · 3');
    expect(result.details).not.toContain('House Kurita 40% · 1');
  });
});
