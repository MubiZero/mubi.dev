import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

const COLLECTIONS = ['profile', 'experience', 'education', 'cases', 'stack', 'contact', 'projects', 'repos', 'ui', 'copy'] as const;

function read(collection: string, locale: string): unknown {
  return load(readFileSync(`src/content/${collection}/${locale}.yaml`, 'utf8'));
}

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.length > 0 ? [shape(value[0])] : [];
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, shape((value as Record<string, unknown>)[key])]),
    );
  }
  return typeof value;
}

/**
 * Walks the ru and en trees together and asserts, at every depth, that
 * object keys match and array lengths match. `shape()` alone only checks
 * the first element of an array, so a divergent length two levels deep
 * (e.g. experience.entries[0].lines) would otherwise pass silently.
 */
function assertParity(ru: unknown, en: unknown, path: string): void {
  if (Array.isArray(en) || Array.isArray(ru)) {
    expect(Array.isArray(ru), `${path} should be an array in ru like it is in en`).toBe(true);
    expect(Array.isArray(en), `${path} should be an array in en like it is in ru`).toBe(true);
    const ruArr = ru as unknown[];
    const enArr = en as unknown[];
    expect(ruArr.length, `${path} should have the same number of entries in both locales`).toBe(enArr.length);
    for (let i = 0; i < enArr.length; i++) {
      assertParity(ruArr[i], enArr[i], `${path}[${i}]`);
    }
    return;
  }

  if (en && typeof en === 'object') {
    expect(ru && typeof ru === 'object', `${path} should be an object in ru like it is in en`).toBe(true);
    const enKeys = Object.keys(en as Record<string, unknown>).sort();
    const ruKeys = Object.keys(ru as Record<string, unknown>).sort();
    expect(ruKeys, `${path} should have the same keys in both locales`).toEqual(enKeys);
    for (const key of enKeys) {
      assertParity((ru as Record<string, unknown>)[key], (en as Record<string, unknown>)[key], `${path}.${key}`);
    }
    return;
  }

  expect(typeof ru, `${path} should be the same type in both locales`).toBe(typeof en);
}

describe.each(COLLECTIONS)('%s', (collection) => {
  it('has the same key structure in both locales', () => {
    expect(shape(read(collection, 'ru'))).toEqual(shape(read(collection, 'en')));
  });

  it('has the same shape and array lengths at every depth in both locales', () => {
    assertParity(read(collection, 'ru'), read(collection, 'en'), collection);
  });
});
