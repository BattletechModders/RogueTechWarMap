// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home } from '../../src/components/pages/Home';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('Home', () => {
  it('renders the welcome heading', () => {
    renderWithRouter();
    const heading = document.querySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading!.textContent).toContain('Welcome to the War Commander');
  });

  it('renders the How to Participate section', () => {
    renderWithRouter();
    const h3s = document.querySelectorAll('h3');
    const howTo = Array.from(h3s).find((h) =>
      h.textContent?.includes('How to Participate')
    );
    expect(howTo).toBeTruthy();
  });

  it('renders external links with target _blank', () => {
    renderWithRouter();
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    expect(externalLinks.length).toBeGreaterThanOrEqual(5);
  });

  it('renders RogueWar Discord link', () => {
    renderWithRouter();
    const links = document.querySelectorAll('a[href="https://discord.gg/JU8tuMG"]');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Mods-In-Exile link', () => {
    renderWithRouter();
    const links = document.querySelectorAll(
      'a[href="https://discourse.modsinexile.com/t/rogue-tech/134"]'
    );
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('renders donation link', () => {
    renderWithRouter();
    const links = document.querySelectorAll(
      'a[href="https://ko-fi.com/roguetech28443"]'
    );
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('renders wiki link', () => {
    renderWithRouter();
    const links = document.querySelectorAll(
      'a[href="https://roguetech.gamepedia.com"]'
    );
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('renders RT Discord support link', () => {
    renderWithRouter();
    const links = document.querySelectorAll(
      'a[href="https://discord.gg/93kxWQZ"]'
    );
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});
