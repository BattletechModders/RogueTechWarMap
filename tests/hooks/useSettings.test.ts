import { describe, it, expect } from 'vitest';
import { initialSettings } from '../../src/components/hooks/types';
import * as fs from 'fs';
import * as path from 'path';

describe('useSettings', () => {
  describe('initialSettings', () => {
    it('has flashActivePlayers set to true by default', () => {
      expect(initialSettings.flashActivePlayers).toBe(true);
    });

    it('matches the Settings interface shape', () => {
      expect(typeof initialSettings.flashActivePlayers).toBe('boolean');
    });
  });

  describe('useSettings implementation', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../src/components/hooks/useSettings.ts'),
      'utf-8'
    );

    it('initializes state from initialSettings', () => {
      expect(content).toContain('useState<Settings>(initialSettings)');
    });

    it('setFlashActive updates flashActivePlayers', () => {
      expect(content).toContain('flashActivePlayers: state');
    });

    it('spreads existing settings when updating', () => {
      expect(content).toContain('...settings');
    });

    it('returns settings and setFlashActive', () => {
      expect(content).toContain('settings');
      expect(content).toContain('setFlashActive');
    });
  });
});
