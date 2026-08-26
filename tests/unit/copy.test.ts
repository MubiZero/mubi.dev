import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Every collection, in step with parity.test.ts: education used to be missing
// here, so its files were exempt from both rules without anyone saying so.
const COLLECTIONS = [
  'profile',
  'experience',
  'education',
  'cases',
  'stack',
  'contact',
  'repos',
  'ui',
  'copy',
];

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
