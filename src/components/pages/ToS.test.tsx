import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToS, BulletPoint } from './ToS';

describe('ToS page', () => {
  it('renders the Terms of Data Use heading', () => {
    render(
      <MemoryRouter>
        <ToS />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Terms of Data Use/i })).toBeInTheDocument();
  });

  it('renders the Humans and Bots sections', () => {
    render(
      <MemoryRouter>
        <ToS />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /^Humans$/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Bots.+Non-Humans/i })).toBeInTheDocument();
  });

  it('renders the page inside the PageTemplate (SideMenu visible)', () => {
    render(
      <MemoryRouter>
        <ToS />
      </MemoryRouter>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
  });
});

describe('BulletPoint', () => {
  it('applies list-disc styling when not nested', () => {
    const { container } = render(<BulletPoint>item</BulletPoint>);
    const li = container.querySelector('li');
    expect(li?.className).toContain('list-disc');
    expect(li?.className).not.toContain('nested-list');
  });

  it('applies nested-list styling when isNested is true', () => {
    const { container } = render(<BulletPoint isNested>item</BulletPoint>);
    const li = container.querySelector('li');
    expect(li?.className).toContain('nested-list');
    expect(li?.className).toContain('ml-12');
  });

  it('renders its children', () => {
    render(<BulletPoint>the item</BulletPoint>);
    expect(screen.getByText('the item')).toBeInTheDocument();
  });
});
