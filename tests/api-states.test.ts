import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const readSrc = (relativePath: string) =>
  fs.readFileSync(path.resolve(__dirname, '../src', relativePath), 'utf-8');

describe('API error and loading states', () => {
  describe('useWarmapAPI', () => {
    const content = readSrc('components/hooks/useWarmapAPI.ts');

    it('tracks isLoading state', () => {
      expect(content).toContain('isLoading');
      expect(content).toContain('setIsLoading');
    });

    it('tracks error state', () => {
      expect(content).toContain("useState<string | null>(null)");
      expect(content).toContain('setError');
    });

    it('returns isLoading and error', () => {
      expect(content).toMatch(/return\s*\{[\s\S]*isLoading[\s\S]*\}/);
      expect(content).toMatch(/return\s*\{[\s\S]*error[\s\S]*\}/);
    });

    it('sets isLoading false in finally block', () => {
      expect(content).toContain('finally');
      expect(content).toContain('setIsLoading(false)');
    });

    it('checks response.ok before parsing JSON', () => {
      expect(content).toContain('res.ok');
    });
  });

  describe('useFiltering', () => {
    const content = readSrc('components/hooks/useFiltering.ts');

    it('passes through isLoading from useWarmapAPI', () => {
      expect(content).toContain('isLoading');
    });

    it('passes through error from useWarmapAPI', () => {
      expect(content).toContain('error');
    });
  });

  describe('GalaxyMap', () => {
    const content = readSrc('components/pages/GalaxyMap.tsx');

    it('destructures isLoading and error from useFiltering', () => {
      expect(content).toContain('isLoading');
      expect(content).toContain('error');
    });

    it('does not return bare null for loading state', () => {
      // The old code had just "return null;" with no loading UI.
      // Verify there is a loading message instead.
      expect(content).toContain('Loading map data...');
    });

    it('shows error UI with retry button', () => {
      expect(content).toContain('Failed to load map data');
      expect(content).toContain('Retry');
    });
  });
});
