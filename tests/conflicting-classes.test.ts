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
 * Extracts all Tailwind height classes (h-*) from a className string.
 * Returns an array of matches.
 */
function extractHeightClasses(className: string): string[] {
  return className.match(/\bh-\d+\b/g) || [];
}

describe('no conflicting Tailwind height classes', () => {
  const files = collectFiles(SRC_DIR);

  it('no element has multiple h-* classes in the same className', () => {
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Match className strings (both static and template literals)
      const classNameRegex = /className[=](?:{?`([^`]*)`}?|"([^"]*)")/g;
      let match;
      while ((match = classNameRegex.exec(content)) !== null) {
        const classValue = match[1] || match[2] || '';
        const heightClasses = extractHeightClasses(classValue);
        if (heightClasses.length > 1) {
          const line = content.substring(0, match.index).split('\n').length;
          violations.push(
            `${path.relative(SRC_DIR, file)}:${line} — conflicting: ${heightClasses.join(', ')}`
          );
        }
      }
    }

    expect(
      violations,
      `Found conflicting height classes:\n${violations.join('\n')}`
    ).toEqual([]);
  });
});
