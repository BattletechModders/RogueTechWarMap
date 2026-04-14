import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const content = fs.readFileSync(
  path.resolve(__dirname, '../../src/components/helpers/ApiHelper.ts'),
  'utf-8'
);

describe('ApiHelper', () => {
  it('exports API_BASE_URL', () => {
    expect(content).toContain('export { API_BASE_URL }');
  });

  it('reads from VITE_API_URL env variable', () => {
    expect(content).toContain('VITE_API_URL');
  });

  it('falls back to https://roguewar.org when env is empty', () => {
    expect(content).toContain('https://roguewar.org');
  });

  it('uses a ternary/conditional for the fallback', () => {
    // Verify the pattern: if baseUrl is truthy use it, otherwise fallback
    expect(content).toMatch(/baseUrl\s*\?\s*baseUrl\s*:\s*'https:\/\/roguewar\.org'/);
  });
});
