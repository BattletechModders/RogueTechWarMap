import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('App.tsx has no commented-out code', () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, '../src/App.tsx'),
    'utf-8'
  );

  it('no commented-out imports', () => {
    expect(content).not.toMatch(/\/\/\s*import\s/);
  });

  it('no commented-out JSX routes', () => {
    expect(content).not.toMatch(/\{\/\*.*<Route/);
  });

  it('no commented-out props', () => {
    expect(content).not.toMatch(/\/\/\s*fallbackElement/);
  });
});
