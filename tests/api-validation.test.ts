import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('API response validation in useWarmapAPI', () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, '../src/components/hooks/useWarmapAPI.ts'),
    'utf-8'
  );

  it('validates faction data is a non-null object', () => {
    expect(content).toContain("typeof factionData !== 'object'");
    expect(content).toContain('Array.isArray(factionData)');
  });

  it('validates system data is an array', () => {
    expect(content).toContain('Array.isArray(systemData)');
  });

  it('throws descriptive errors on invalid shapes', () => {
    expect(content).toContain('Faction API returned unexpected data shape');
    expect(content).toContain('System API returned unexpected data shape');
  });
});
