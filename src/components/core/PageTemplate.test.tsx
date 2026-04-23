import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PageTemplate from './PageTemplate';

const renderTemplate = (children: React.ReactNode) =>
  render(
    <MemoryRouter>
      <PageTemplate>{children}</PageTemplate>
    </MemoryRouter>
  );

describe('PageTemplate', () => {
  it('renders its children inside the main content area', () => {
    renderTemplate(<p>hello world</p>);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('renders the SideMenu (home/map/tos links)', () => {
    renderTemplate(<p>content</p>);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText(/Terms of Data Use/i)).toBeInTheDocument();
  });

  it('wraps content with the black-background chrome', () => {
    const { container } = renderTemplate(<p>content</p>);
    expect(container.querySelector('.bg-black')).not.toBeNull();
  });
});
