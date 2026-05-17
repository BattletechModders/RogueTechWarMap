import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import BottomFilterPanel from './BottomFilterPanel';

// react-select uses dynamic imports internally; stub the lazy-loaded component
// so tests don't need to resolve the actual module graph.
vi.mock('react-select', () => ({
  default: ({ placeholder }: { placeholder?: string }) =>
    React.createElement('div', { 'data-testid': 'faction-select' }, placeholder ?? ''),
}));

// lucide-react icons — stub to plain elements to avoid SVG rendering issues.
vi.mock('lucide-react', () => ({
  ChevronsDown: () => React.createElement('span', null, 'down'),
  ChevronsUp: () => React.createElement('span', null, 'up'),
}));

const defaultProps = {
  searchTerm: '',
  setSearchTerm: vi.fn(),
  factions: ['ComStar', 'House Davion'],
  selectedFactions: [],
  setSelectedFactions: vi.fn(),
};

describe('BottomFilterPanel', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 1;
    }) as typeof window.requestAnimationFrame);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('renders collapsed by default showing the expand chevron', () => {
    const { getByText } = render(React.createElement(BottomFilterPanel, defaultProps));
    expect(getByText('up')).toBeTruthy(); // ChevronsUp shown when closed
  });

  it('expands and shows the search input when the toggle is clicked', () => {
    const { getByText, getByPlaceholderText } = render(
      React.createElement(BottomFilterPanel, defaultProps)
    );
    fireEvent.click(getByText('up'));
    expect(getByPlaceholderText('Search systems...')).toBeTruthy();
    expect(getByText('down')).toBeTruthy(); // ChevronsDown shown when open
  });

  it('calls setSearchTerm when the search input changes', () => {
    const setSearchTerm = vi.fn();
    const { getByText, getByPlaceholderText } = render(
      React.createElement(BottomFilterPanel, { ...defaultProps, setSearchTerm })
    );
    fireEvent.click(getByText('up'));
    fireEvent.change(getByPlaceholderText('Search systems...'), {
      target: { value: 'Terra' },
    });
    expect(setSearchTerm).toHaveBeenCalledWith('Terra');
  });

  it('renders selected faction chips and calls setSelectedFactions when one is removed', () => {
    const setSelectedFactions = vi.fn();
    const { getByText } = render(
      React.createElement(BottomFilterPanel, {
        ...defaultProps,
        selectedFactions: ['ComStar'],
        setSelectedFactions,
      })
    );
    // Open the panel first so the chips are visible.
    fireEvent.click(getByText('up'));
    expect(getByText('ComStar')).toBeTruthy();

    // Click the remove 'x' next to 'ComStar'.
    const removeBtn = getByText('x');
    fireEvent.click(removeBtn);
    expect(setSelectedFactions).toHaveBeenCalledWith([]);
  });

  it('registers a resize listener on mount and removes it on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(React.createElement(BottomFilterPanel, defaultProps));

    const added = addSpy.mock.calls.filter(([event]) => event === 'resize');
    expect(added.length).toBeGreaterThan(0);

    unmount();

    const removed = removeSpy.mock.calls.filter(([event]) => event === 'resize');
    expect(removed.length).toBeGreaterThanOrEqual(added.length);
  });
});
