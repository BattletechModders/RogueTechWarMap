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
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Known invalid Tailwind classes that have been found and fixed.
 * Each pattern is a regex that should NOT appear in any className string.
 */
const INVALID_CLASS_PATTERNS = [
  { pattern: /\btext-2x\b/, description: 'text-2x (should be text-2xl)' },
];

describe('no known invalid Tailwind classes in src/', () => {
  const files = collectFiles(SRC_DIR);

  for (const { pattern, description } of INVALID_CLASS_PATTERNS) {
    it(`no occurrences of "${description}"`, () => {
      const violations: string[] = [];
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (pattern.test(line)) {
            violations.push(`${path.relative(SRC_DIR, file)}:${i + 1}`);
          }
        });
      }
      expect(violations, `Found ${description} in:\n${violations.join('\n')}`).toEqual([]);
    });
  }
});
