// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/react';
import BottomFilterPanel from '../../src/components/ui/BottomFilterPanel';

// Mock requestAnimationFrame globally for height animation
const origRAF = globalThis.requestAnimationFrame;
globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
  cb(0);
  return 0;
}) as typeof requestAnimationFrame;

const defaultProps = {
  searchTerm: '',
  setSearchTerm: vi.fn(),
  factions: ['House Steiner', 'House Davion', 'ComStar'],
  selectedFactions: [] as string[],
  setSelectedFactions: vi.fn(),
};

async function renderAndOpen(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  const result = render(<BottomFilterPanel {...props} />);
  const chevron = document.querySelector('[style*="cursor: pointer"]');
  await act(async () => {
    fireEvent.click(chevron!);
  });
  return result;
}

describe('BottomFilterPanel', () => {
  afterEach(() => cleanup());

  it('renders in collapsed state by default', () => {
    render(<BottomFilterPanel {...defaultProps} />);
    const input = document.querySelector('input[placeholder="Search systems…"]');
    expect(input).toBeNull();
  });

  it('expands when chevron is clicked', async () => {
    await renderAndOpen();
    const input = document.querySelector('input[placeholder="Search systems…"]');
    expect(input).toBeTruthy();
  });

  it('renders search input with correct value when open', async () => {
    await renderAndOpen({ searchTerm: 'Terra' });
    const input = document.querySelector(
      'input[placeholder="Search systems…"]'
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input?.value).toBe('Terra');
  });

  it('calls setSearchTerm on input change', async () => {
    const setSearchTerm = vi.fn();
    await renderAndOpen({ setSearchTerm });
    const input = document.querySelector('input[placeholder="Search systems…"]')!;
    fireEvent.change(input, { target: { value: 'Sol' } });
    expect(setSearchTerm).toHaveBeenCalledWith('Sol');
  });

  it('renders selected faction chips when open', async () => {
    await renderAndOpen({
      selectedFactions: ['House Steiner', 'ComStar'],
    });
    const body = document.body.textContent || '';
    expect(body).toContain('House Steiner');
    expect(body).toContain('ComStar');
  });

  it('calls setSelectedFactions when removing a faction chip', async () => {
    const setSelectedFactions = vi.fn();
    await renderAndOpen({
      selectedFactions: ['House Steiner', 'ComStar'],
      setSelectedFactions,
    });
    const removeButtons = document.querySelectorAll('span[style*="cursor: pointer"]');
    const xButton = Array.from(removeButtons).find(
      (el) => el.textContent === 'x'
    );
    expect(xButton).toBeTruthy();
    fireEvent.click(xButton!);
    expect(setSelectedFactions).toHaveBeenCalledWith(['ComStar']);
  });

  it('renders react-select with Filter factions placeholder when open', async () => {
    await renderAndOpen();
    // react-select renders the placeholder in a div
    const body = document.body.innerHTML;
    expect(body).toContain('Filter factions');
  });
});
