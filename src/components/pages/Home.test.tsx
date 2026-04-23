import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home, HomeCard } from './Home';

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe('Home page', () => {
  it('renders the welcome headline', () => {
    renderHome();
    expect(
      screen.getByRole('heading', { name: /Welcome to the War Commander/i })
    ).toBeInTheDocument();
  });

  it('renders five HomeCards with their external links', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /RogueWar Discord/i })).toHaveAttribute(
      'href',
      'https://discord.gg/JU8tuMG'
    );
    expect(screen.getByRole('link', { name: /Mods-In-Exile/i })).toHaveAttribute(
      'href',
      'https://discourse.modsinexile.com/t/rogue-tech/134'
    );
    expect(screen.getByRole('link', { name: /RT Discord/i })).toHaveAttribute(
      'href',
      'https://discord.gg/93kxWQZ'
    );
    expect(screen.getByRole('link', { name: /^Wiki$/i })).toHaveAttribute(
      'href',
      'https://roguetech.gamepedia.com'
    );
    expect(screen.getByRole('link', { name: /Donate/i })).toHaveAttribute(
      'href',
      'https://ko-fi.com/roguetech28443'
    );
  });

  it('renders the "How to Participate" heading', () => {
    renderHome();
    expect(
      screen.getByRole('heading', { name: /How to Participate/i })
    ).toBeInTheDocument();
  });

  it('renders the side menu via PageTemplate', () => {
    renderHome();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
  });
});

describe('HomeCard', () => {
  // CardStyle is not exported, so test the public HomeCard API by rendering.
  it('renders the heading, children, and button label with the supplied URI', () => {
    render(
      <HomeCard
        // @ts-expect-error - CardStyle enum is not exported; the string value matches the type union at runtime
        style="-primary"
        heading="Test Heading"
        buttonLabel="Go"
        buttonUri="https://example.com"
      >
        card body
      </HomeCard>
    );
    expect(screen.getByText('Test Heading')).toBeInTheDocument();
    expect(screen.getByText('card body')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Go/i });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
