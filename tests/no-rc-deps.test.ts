import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('no release candidate dependencies', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
  );

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  it('no dependency versions contain -rc', () => {
    const rcDeps: string[] = [];
    for (const [name, version] of Object.entries(allDeps)) {
      if (typeof version === 'string' && version.includes('-rc')) {
        rcDeps.push(`${name}: ${version}`);
      }
    }
    expect(rcDeps, `Found RC versions:\n${rcDeps.join('\n')}`).toEqual([]);
  });
});
