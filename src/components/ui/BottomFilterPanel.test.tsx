import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BottomFilterPanel from './BottomFilterPanel';

const baseProps = () => ({
  searchTerm: '',
  setSearchTerm: vi.fn(),
  factions: ['Davion', 'Kurita', 'Liao'],
  selectedFactions: [] as string[],
  setSelectedFactions: vi.fn(),
});

describe('BottomFilterPanel', () => {
  it('starts collapsed — the search input is not yet rendered', () => {
    render(<BottomFilterPanel {...baseProps()} />);
    expect(screen.queryByPlaceholderText(/Search systems/i)).toBeNull();
  });

  it('expands when the chevron area is clicked, revealing the search input', () => {
    const { container } = render(<BottomFilterPanel {...baseProps()} />);
    const toggle = container.querySelector('div[style*="cursor: pointer"]');
    expect(toggle).not.toBeNull();

    act(() => {
      fireEvent.click(toggle!);
    });

    expect(screen.getByPlaceholderText(/Search systems/i)).toBeInTheDocument();
  });

  it('forwards search input changes through setSearchTerm', async () => {
    const props = baseProps();
    const { container } = render(<BottomFilterPanel {...props} />);
    const toggle = container.querySelector('div[style*="cursor: pointer"]')!;
    fireEvent.click(toggle);

    const input = screen.getByPlaceholderText(/Search systems/i) as HTMLInputElement;
    await userEvent.type(input, 'a');
    expect(props.setSearchTerm).toHaveBeenCalledWith('a');
  });

  it('renders a removable chip for each selected faction and removes it on click', () => {
    const props = baseProps();
    props.selectedFactions = ['Davion'];
    const { container } = render(<BottomFilterPanel {...props} />);
    const toggle = container.querySelector('div[style*="cursor: pointer"]')!;
    fireEvent.click(toggle);

    // chip text should be visible
    expect(screen.getByText('Davion')).toBeInTheDocument();

    // The chip has an "x" remove child right next to the label
    const removeButton = screen.getByText('x');
    fireEvent.click(removeButton);

    expect(props.setSelectedFactions).toHaveBeenCalledWith([]);
  });

  it('renders nothing in the chip row when no factions are selected', () => {
    const props = baseProps();
    const { container } = render(<BottomFilterPanel {...props} />);
    const toggle = container.querySelector('div[style*="cursor: pointer"]')!;
    fireEvent.click(toggle);

    expect(screen.queryByText('x')).toBeNull();
  });

  it('toggles the help tooltip on the "i" icon when in mobile width', () => {
    // Simulate narrow viewport so tooltip uses click-to-toggle semantics
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 500,
    });
    const { container } = render(<BottomFilterPanel {...baseProps()} />);
    const toggle = container.querySelector('div[style*="cursor: pointer"]')!;
    fireEvent.click(toggle);

    // Find the round "i" help icon by text; scan help icon spans
    const helpIcon = screen.getByText('i');
    // Click once → tooltip shown
    fireEvent.click(helpIcon);
    expect(
      screen.getByText(/Only factions that currently have systems on the map/i)
    ).toBeInTheDocument();

    // Click again → tooltip hidden
    fireEvent.click(helpIcon);
    expect(
      screen.queryByText(/Only factions that currently have systems on the map/i)
    ).toBeNull();
  });
});
