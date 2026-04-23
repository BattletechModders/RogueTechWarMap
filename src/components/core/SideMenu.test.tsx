import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SideMenu } from './SideMenu';

const renderMenu = () =>
  render(
    <MemoryRouter>
      <SideMenu />
    </MemoryRouter>
  );

describe('SideMenu', () => {
  it('renders the RogueWar logo image', () => {
    const { container } = renderMenu();
    const logo = container.querySelector('#RoguewarLogo') as HTMLImageElement | null;
    expect(logo).not.toBeNull();
    expect(logo?.getAttribute('src')).toBe('/rtLogo.png');
  });

  it('renders Home and Map nav items as links pointing to / and /map', () => {
    renderMenu();
    const home = screen.getByText('Home').closest('a');
    const map = screen.getByText('Map').closest('a');
    expect(home).toHaveAttribute('href', '/');
    expect(map).toHaveAttribute('href', '/map');
  });

  it('renders the Terms of Data Use link pointing to /tos', () => {
    renderMenu();
    const tos = screen.getByText(/Terms of Data Use/i).closest('a');
    expect(tos).toHaveAttribute('href', '/tos');
  });

  it('wraps the logo in a link home (clicking the logo goes to /)', () => {
    const { container } = renderMenu();
    const anchor = container.querySelector('#RoguewarLogo')?.closest('a');
    expect(anchor).toHaveAttribute('href', '/');
  });
});
