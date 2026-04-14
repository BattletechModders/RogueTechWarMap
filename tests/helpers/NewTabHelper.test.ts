import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('openInNewTab', () => {
  const mockOpen = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('window', { open: mockOpen });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockOpen.mockClear();
  });

  it('calls window.open with the given URL', async () => {
    const { openInNewTab } = await import('../../src/components/helpers/NewTabHelper');
    openInNewTab('https://example.com');
    expect(mockOpen).toHaveBeenCalledOnce();
    expect(mockOpen.mock.calls[0][0]).toBe('https://example.com');
  });

  it('opens in a new tab (_blank)', async () => {
    const { openInNewTab } = await import('../../src/components/helpers/NewTabHelper');
    openInNewTab('https://example.com');
    expect(mockOpen.mock.calls[0][1]).toBe('_blank');
  });

  it('includes noreferrer for security', async () => {
    const { openInNewTab } = await import('../../src/components/helpers/NewTabHelper');
    openInNewTab('https://example.com');
    expect(mockOpen.mock.calls[0][2]).toBe('noreferrer');
  });

  it('works with a URL object', async () => {
    const { openInNewTab } = await import('../../src/components/helpers/NewTabHelper');
    const url = new URL('https://example.com/path');
    openInNewTab(url);
    expect(mockOpen).toHaveBeenCalledWith(url, '_blank', 'noreferrer');
  });
});
