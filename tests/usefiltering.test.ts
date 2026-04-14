import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const FILTERING_PATH = path.resolve(
  __dirname,
  '../src/components/hooks/useFiltering.ts'
);

describe('useFiltering return shape', () => {
  const content = fs.readFileSync(FILTERING_PATH, 'utf-8');

  it('returns displaySystems', () => {
    expect(content).toMatch(/return\s*\{[\s\S]*displaySystems[\s\S]*\}/);
  });

  it('returns factions', () => {
    expect(content).toMatch(/return\s*\{[\s\S]*factions[\s\S]*\}/);
  });

  it('returns capitals', () => {
    expect(content).toMatch(/return\s*\{[\s\S]*capitals[\s\S]*\}/);
  });

  it('returns fetchFactionData', () => {
    expect(content).toMatch(/return\s*\{[\s\S]*fetchFactionData[\s\S]*\}/);
  });

  it('returns fetchSystemData', () => {
    expect(content).toMatch(/return\s*\{[\s\S]*fetchSystemData[\s\S]*\}/);
  });

  it('returns settings', () => {
    expect(content).toMatch(/return\s*\{[\s\S]*settings[\s\S]*\}/);
  });

  it('does not expose internal projectSystemData', () => {
    // projectSystemData is used internally but should not be in the return
    const returnBlock = content.match(/return\s*\{[\s\S]*?\};/);
    expect(returnBlock).not.toBeNull();
    expect(returnBlock![0]).not.toContain('projectSystemData');
  });

  it('does not expose setFlashActive', () => {
    const returnBlock = content.match(/return\s*\{[\s\S]*?\};/);
    expect(returnBlock).not.toBeNull();
    expect(returnBlock![0]).not.toContain('setFlashActive');
  });
});
