import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../src');

describe('magic numbers replaced with named constants', () => {
  it('GalaxyMap.tsx does not use raw breakpoint 768', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'components/pages/GalaxyMap.tsx'),
      'utf-8'
    );
    expect(content).not.toMatch(/\b768\b/);
  });

  it('GalaxyMap.tsx does not use raw background dimensions', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'components/pages/GalaxyMap.tsx'),
      'utf-8'
    );
    expect(content).not.toMatch(/[-]?4800/);
    expect(content).not.toMatch(/[-]?2700/);
    expect(content).not.toMatch(/\b9600\b/);
    expect(content).not.toMatch(/\b5400\b/);
  });

  it('BottomFilterPanel.tsx does not use raw breakpoint 768', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'components/ui/BottomFilterPanel.tsx'),
      'utf-8'
    );
    expect(content).not.toMatch(/\b768\b/);
  });

  it('StarSystem.tsx does not use raw animation speed 0.005', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'components/ui/StarSystem.tsx'),
      'utf-8'
    );
    expect(content).not.toMatch(/\b0\.005\b/);
  });

  it('constants.ts exports all expected values', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'components/constants.ts'),
      'utf-8'
    );
    expect(content).toContain('DESKTOP_BREAKPOINT');
    expect(content).toContain('BG_IMAGE_X');
    expect(content).toContain('BG_IMAGE_Y');
    expect(content).toContain('BG_IMAGE_WIDTH');
    expect(content).toContain('BG_IMAGE_HEIGHT');
    expect(content).toContain('FLASH_ANIMATION_SPEED');
  });
});
