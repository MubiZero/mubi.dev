import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const COLLECTIONS = ['profile', 'experience', 'cases', 'stack', 'contact', 'ui'];

function files(locale: string): string[] {
  return COLLECTIONS.map((collection) => `src/content/${collection}/${locale}.yaml`);
}

describe('English copy', () => {
  it('contains no em-dash', () => {
    for (const path of files('en')) {
      expect(readFileSync(path, 'utf8'), path).not.toContain('—');
    }
  });
});

describe('every locale directory', () => {
  it('holds exactly one file per locale', () => {
    for (const collection of COLLECTIONS) {
      expect(readdirSync(`src/content/${collection}`).sort()).toEqual(['en.yaml', 'ru.yaml']);
    }
  });
});
