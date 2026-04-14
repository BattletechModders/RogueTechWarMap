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

describe('no console statements in production code', () => {
  const files = collectFiles(SRC_DIR);

  it('no console.log calls in src/', () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (/\bconsole\.log\b/.test(line) && !line.trimStart().startsWith('//')) {
          violations.push(`${path.relative(SRC_DIR, file)}:${i + 1}`);
        }
      });
    }
    expect(violations, `Found console.log in:\n${violations.join('\n')}`).toEqual([]);
  });

  it('no console.error calls in src/', () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (/\bconsole\.error\b/.test(line) && !line.trimStart().startsWith('//')) {
          violations.push(`${path.relative(SRC_DIR, file)}:${i + 1}`);
        }
      });
    }
    expect(violations, `Found console.error in:\n${violations.join('\n')}`).toEqual([]);
  });
});
