import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../src');

function collectFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe('no flashActivePlayes typo in src/', () => {
  const files = collectFiles(SRC_DIR);

  it('flashActivePlayes does not appear anywhere', () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('flashActivePlayes')) {
        violations.push(path.relative(SRC_DIR, file));
      }
    }
    expect(violations, `Found typo "flashActivePlayes" in:\n${violations.join('\n')}`).toEqual([]);
  });

  it('flashActivePlayers exists in Settings.ts', () => {
    const content = fs.readFileSync(
      path.resolve(SRC_DIR, 'components/hooks/types/Settings.ts'),
      'utf-8'
    );
    expect(content).toContain('flashActivePlayers');
  });
});
