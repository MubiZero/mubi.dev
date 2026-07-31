import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

const COLLECTIONS = ['profile', 'experience', 'cases', 'stack', 'contact', 'ui'] as const;

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

describe.each(COLLECTIONS)('%s', (collection) => {
  it('has the same key structure in both locales', () => {
    expect(shape(read(collection, 'ru'))).toEqual(shape(read(collection, 'en')));
  });

  it('has the same number of entries in both locales', () => {
    const en = read(collection, 'en') as Record<string, unknown>;
    const ru = read(collection, 'ru') as Record<string, unknown>;
    for (const key of Object.keys(en)) {
      if (Array.isArray(en[key])) {
        expect((ru[key] as unknown[]).length).toBe((en[key] as unknown[]).length);
      }
    }
  });
});
