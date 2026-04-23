import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openInNewTab } from './NewTabHelper';

describe('openInNewTab', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('calls window.open with the URL, _blank target, and noreferrer features', () => {
    openInNewTab('https://example.com');
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noreferrer');
  });

  it('accepts URL instances as well as strings', () => {
    const url = new URL('https://example.com/path');
    openInNewTab(url);
    expect(openSpy).toHaveBeenCalledWith(url, '_blank', 'noreferrer');
  });
});
