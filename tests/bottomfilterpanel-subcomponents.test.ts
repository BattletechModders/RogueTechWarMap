import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const UI_DIR = path.resolve(__dirname, '../src/components/ui');

describe('BottomFilterPanel subcomponents', () => {
  it('SearchInput.tsx exists', () => {
    expect(fs.existsSync(path.join(UI_DIR, 'SearchInput.tsx'))).toBe(true);
  });

  it('FactionSelector.tsx exists', () => {
    expect(fs.existsSync(path.join(UI_DIR, 'FactionSelector.tsx'))).toBe(true);
  });

  it('BottomFilterPanel imports SearchInput', () => {
    const content = fs.readFileSync(
      path.join(UI_DIR, 'BottomFilterPanel.tsx'),
      'utf-8'
    );
    expect(content).toContain("from './SearchInput'");
  });

  it('BottomFilterPanel imports FactionSelector', () => {
    const content = fs.readFileSync(
      path.join(UI_DIR, 'BottomFilterPanel.tsx'),
      'utf-8'
    );
    expect(content).toContain("from './FactionSelector'");
  });

  it('BottomFilterPanel no longer contains react-select import', () => {
    const content = fs.readFileSync(
      path.join(UI_DIR, 'BottomFilterPanel.tsx'),
      'utf-8'
    );
    expect(content).not.toContain('react-select');
  });

  it('BottomFilterPanel is under 130 lines', () => {
    const content = fs.readFileSync(
      path.join(UI_DIR, 'BottomFilterPanel.tsx'),
      'utf-8'
    );
    expect(content.split('\n').length).toBeLessThan(130);
  });
});
