// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToS } from '../../src/components/pages/ToS';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <ToS />
    </MemoryRouter>
  );
}

describe('ToS', () => {
  it('renders the Terms of Data Use heading', () => {
    renderWithRouter();
    const h2s = document.querySelectorAll('h2');
    const heading = Array.from(h2s).find((h) =>
      h.textContent?.includes('Terms of Data Use')
    );
    expect(heading).toBeTruthy();
  });

  it('renders the Humans section', () => {
    renderWithRouter();
    const h3s = document.querySelectorAll('h3');
    const section = Array.from(h3s).find((h) =>
      h.textContent?.includes('Humans')
    );
    expect(section).toBeTruthy();
  });

  it('renders the Bots section', () => {
    renderWithRouter();
    const body = document.body.textContent || '';
    expect(body).toContain('Bots');
    expect(body).toContain('Non-Humans');
  });

  it('renders bullet points as list items', () => {
    renderWithRouter();
    const listItems = document.querySelectorAll('li');
    expect(listItems.length).toBeGreaterThanOrEqual(7);
  });

  it('renders nested bullet points with nested-list class', () => {
    renderWithRouter();
    const nestedItems = document.querySelectorAll('.nested-list');
    expect(nestedItems.length).toBeGreaterThanOrEqual(4);
  });

  it('renders API usage guidance', () => {
    renderWithRouter();
    const body = document.body.textContent || '';
    expect(body).toContain('API usage rate must be reasonable');
  });
});
