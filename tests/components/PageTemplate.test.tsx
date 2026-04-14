// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PageTemplate from '../../src/components/core/PageTemplate';

describe('PageTemplate', () => {
  it('renders children content', () => {
    render(
      <MemoryRouter>
        <PageTemplate>
          <p>Test content</p>
        </PageTemplate>
      </MemoryRouter>
    );
    expect(screen.getByText('Test content')).toBeTruthy();
  });

  it('renders the SideMenu', () => {
    render(
      <MemoryRouter>
        <PageTemplate>
          <p>Content</p>
        </PageTemplate>
      </MemoryRouter>
    );
    expect(document.querySelector('#sideMenu')).toBeTruthy();
  });

  it('wraps content in a container with ml-40 class', () => {
    render(
      <MemoryRouter>
        <PageTemplate>
          <p data-testid="child">Child</p>
        </PageTemplate>
      </MemoryRouter>
    );
    const child = screen.getByTestId('child');
    expect(child.closest('.ml-40')).toBeTruthy();
  });

  it('has bg-black outer wrapper', () => {
    render(
      <MemoryRouter>
        <PageTemplate>
          <p>Content</p>
        </PageTemplate>
      </MemoryRouter>
    );
    expect(document.querySelector('.bg-black')).toBeTruthy();
  });
});
