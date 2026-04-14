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

describe('react-icons is fully replaced by lucide-react', () => {
  const files = collectFiles(SRC_DIR);

  it('no imports from react-icons in src/', () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (/from\s+['"]react-icons/.test(content)) {
        violations.push(path.relative(SRC_DIR, file));
      }
    }
    expect(violations, `Found react-icons imports in:\n${violations.join('\n')}`).toEqual([]);
  });

  it('react-icons is not in package.json dependencies', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
    );
    expect(packageJson.dependencies).not.toHaveProperty('react-icons');
  });
});
