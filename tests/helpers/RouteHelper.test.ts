import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const content = fs.readFileSync(
  path.resolve(__dirname, '../../src/components/helpers/RouteHelper.ts'),
  'utf-8'
);

describe('RouteHelper', () => {
  it('exports BASE_ROUTE', () => {
    expect(content).toContain('export { BASE_ROUTE }');
  });

  it('reads from VITE_BASE_URL env variable', () => {
    expect(content).toContain('VITE_BASE_URL');
  });

  it('falls back to / when env is empty', () => {
    expect(content).toMatch(/baseRoute\s*\?\s*baseRoute\s*:\s*'\/'/);
  });
});
