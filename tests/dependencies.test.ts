import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const REMOVED_PACKAGES = [
  'axios',
  'react-axios',
  'localforage',
  'match-sorter',
  'prop-types',
  'swr',
];

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

describe('unused dependencies are not imported', () => {
  const files = collectFiles(SRC_DIR);

  for (const pkg of REMOVED_PACKAGES) {
    it(`no src/ file imports "${pkg}"`, () => {
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const importPattern = new RegExp(
          `(?:import|require)\\s*(?:\\(|.*from\\s*)['"]${pkg}(?:[/'"])`
        );
        expect(
          importPattern.test(content),
          `Found import of "${pkg}" in ${path.relative(SRC_DIR, file)}`
        ).toBe(false);
      }
    });
  }
});

describe('removed packages are not in package.json', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
  );
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const pkg of REMOVED_PACKAGES) {
    it(`"${pkg}" is not listed as a dependency`, () => {
      expect(allDeps).not.toHaveProperty(pkg);
    });
  }
});
