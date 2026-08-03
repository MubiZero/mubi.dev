import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('QA capture command', () => {
  it('documents its reproducible invocation without launching a browser', () => {
    const result = spawnSync(process.execPath, [resolve('scripts/capture-qa.mjs'), '--help'], {
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      'npm run qa:capture -- --output /tmp/mubi-dev-final-qa',
    );
  });
});
