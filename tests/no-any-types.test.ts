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

describe('no unsafe any types in production code', () => {
  const files = collectFiles(SRC_DIR);

  it('no any[] parameter types in src/', () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        const trimmed = line.trimStart();
        // Skip comments
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
        if (/\bany\[\]/.test(line)) {
          violations.push(`${path.relative(SRC_DIR, file)}:${i + 1}: ${trimmed}`);
        }
      });
    }
    expect(
      violations,
      `Found any[] usage in:\n${violations.join('\n')}`
    ).toEqual([]);
  });
});
