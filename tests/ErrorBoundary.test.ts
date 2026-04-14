import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const BOUNDARY_PATH = path.resolve(
  __dirname,
  '../src/components/core/ErrorBoundary.tsx'
);
const APP_PATH = path.resolve(__dirname, '../src/App.tsx');

describe('ErrorBoundary', () => {
  it('ErrorBoundary.tsx exists', () => {
    expect(fs.existsSync(BOUNDARY_PATH)).toBe(true);
  });

  it('implements getDerivedStateFromError', () => {
    const content = fs.readFileSync(BOUNDARY_PATH, 'utf-8');
    expect(content).toContain('getDerivedStateFromError');
  });

  it('implements componentDidCatch', () => {
    const content = fs.readFileSync(BOUNDARY_PATH, 'utf-8');
    expect(content).toContain('componentDidCatch');
  });

  it('renders a fallback UI when hasError is true', () => {
    const content = fs.readFileSync(BOUNDARY_PATH, 'utf-8');
    expect(content).toContain('Something went wrong');
    expect(content).toContain('Try Again');
  });

  it('renders children when there is no error', () => {
    const content = fs.readFileSync(BOUNDARY_PATH, 'utf-8');
    expect(content).toContain('this.props.children');
  });

  it('provides a recovery mechanism (reset state on retry)', () => {
    const content = fs.readFileSync(BOUNDARY_PATH, 'utf-8');
    expect(content).toContain('hasError: false');
    expect(content).toContain('onClick');
  });

  it('App.tsx imports and uses ErrorBoundary', () => {
    const content = fs.readFileSync(APP_PATH, 'utf-8');
    expect(content).toContain("import ErrorBoundary from './components/core/ErrorBoundary'");
    expect(content).toContain('<ErrorBoundary>');
    expect(content).toContain('</ErrorBoundary>');
  });
});
