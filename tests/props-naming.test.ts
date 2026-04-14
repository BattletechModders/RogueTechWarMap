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

describe('React component prop types use Props suffix, not Interface', () => {
  const files = collectFiles(SRC_DIR);

  it('no interface declarations ending with "Interface" for component props', () => {
    const violations: string[] = [];
    // Match patterns like "interface FooInterface {" or "export interface FooInterface {"
    const pattern = /interface\s+\w+Interface\s*\{/;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (pattern.test(line)) {
          violations.push(`${path.relative(SRC_DIR, file)}:${i + 1}: ${line.trim()}`);
        }
      });
    }

    expect(
      violations,
      `Found "Interface" suffix on prop types:\n${violations.join('\n')}`
    ).toEqual([]);
  });
});
