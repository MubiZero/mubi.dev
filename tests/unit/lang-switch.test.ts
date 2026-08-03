import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('LangSwitch', () => {
  it('uses the supplied localized target-language name in its accessible label', () => {
    const fixtureRoot = mkdtempSync(resolve(tmpdir(), 'mubi-lang-switch-'));
    const pagePath = resolve(fixtureRoot, 'src/pages/index.astro');
    const componentPath = resolve(fixtureRoot, 'src/components/LangSwitch.astro');
    const localePath = resolve(fixtureRoot, 'src/lib/locale.ts');
    symlinkSync(resolve(projectRoot, 'node_modules'), resolve(fixtureRoot, 'node_modules'), 'dir');
    mkdirSync(dirname(pagePath), { recursive: true });
    mkdirSync(dirname(componentPath), { recursive: true });
    mkdirSync(dirname(localePath), { recursive: true });
    writeFileSync(
      componentPath,
      readFileSync(resolve(projectRoot, 'src/components/LangSwitch.astro'), 'utf8'),
    );
    writeFileSync(localePath, readFileSync(resolve(projectRoot, 'src/lib/locale.ts'), 'utf8'));
    writeFileSync(
      pagePath,
      `---\nimport LangSwitch from '../components/LangSwitch.astro';\n---\n<LangSwitch locale="en" label="Switch language" otherLanguageName="Target language from catalog" />\n`,
    );

    try {
      execFileSync(
        process.execPath,
        [resolve(projectRoot, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', fixtureRoot],
        { cwd: projectRoot, stdio: 'pipe' },
      );
      const html = readFileSync(resolve(fixtureRoot, 'dist/index.html'), 'utf8');
      expect(html).toContain('aria-label="Switch language: Target language from catalog"');
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
