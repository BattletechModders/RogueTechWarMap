// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SideMenu } from '../../src/components/core/SideMenu';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <SideMenu />
    </MemoryRouter>
  );
}

describe('SideMenu', () => {
  it('renders the logo image', () => {
    renderWithRouter();
    const logo = document.querySelector('#RoguewarLogo') as HTMLImageElement;
    expect(logo).toBeTruthy();
    expect(logo.src).toContain('rtLogo.png');
  });

  it('renders navigation menu items', () => {
    renderWithRouter();
    const menuItems = document.querySelectorAll('nav ul li');
    expect(menuItems.length).toBeGreaterThanOrEqual(2);
  });

  it('renders links to / and /map in nav', () => {
    renderWithRouter();
    const navLinks = document.querySelectorAll('nav a');
    const hrefs = Array.from(navLinks).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/map');
  });

  it('renders Terms of Data Use link to /tos', () => {
    renderWithRouter();
    const allLinks = document.querySelectorAll('a');
    const tosLink = Array.from(allLinks).find((a) =>
      a.textContent?.includes('Terms of Data Use')
    );
    expect(tosLink).toBeTruthy();
    expect(tosLink!.getAttribute('href')).toBe('/tos');
  });

  it('has the sideMenu container', () => {
    renderWithRouter();
    expect(document.querySelector('#sideMenu')).toBeTruthy();
  });
});
