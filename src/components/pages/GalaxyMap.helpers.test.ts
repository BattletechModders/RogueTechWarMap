import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getDesktopLineSegments,
  getTooltipFontSize,
  getViewportSize,
  parseMobileTooltipData,
} from './GalaxyMap.helpers';

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
});
