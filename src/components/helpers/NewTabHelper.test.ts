import { describe, it, expect, vi, afterEach } from 'vitest';
import { openInNewTab } from './NewTabHelper';

describe('openInNewTab', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens the URL in a new noreferrer tab', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    openInNewTab('https://example.com');
    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noreferrer');
  });

  it('accepts a URL object', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    openInNewTab(new URL('https://example.com/path'));
    expect(open).toHaveBeenCalledWith(expect.any(URL), '_blank', 'noreferrer');
  });
});
