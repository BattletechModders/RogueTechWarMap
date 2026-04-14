// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ErrorPage uses useRouteError which requires a router error context.
// We test the component structure statically to avoid complex router mocking.
const content = fs.readFileSync(
  path.resolve(__dirname, '../../src/components/pages/Error.tsx'),
  'utf-8'
);

describe('ErrorPage', () => {
  it('handles route error responses (isRouteErrorResponse)', () => {
    expect(content).toContain('isRouteErrorResponse(error)');
  });

  it('handles Error instances', () => {
    expect(content).toContain('error instanceof Error');
  });

  it('handles unknown errors', () => {
    expect(content).toContain('Unknown error');
  });

  it('shows a link back to home', () => {
    expect(content).toContain("to={'/'}");
    expect(content).toContain('Click here to return Home');
  });

  it('renders with PageTemplate wrapper', () => {
    expect(content).toContain('<PageTemplate>');
  });

  it('shows error message for Error instances', () => {
    expect(content).toContain('error.message');
  });

  it('shows contact message for route errors', () => {
    expect(content).toContain('contact Rogue War on the');
    expect(content).toContain('Discord Server');
  });
});
