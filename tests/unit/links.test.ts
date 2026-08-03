import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

const LOCALES = ['ru', 'en'] as const;

function read<T>(collection: string, locale: string): T {
  return load(readFileSync(`src/content/${collection}/${locale}.yaml`, 'utf8')) as T;
}

type Cases = { entries: { id: string; metrics: { value: string; label: string }[] }[] };

describe.each(LOCALES)('%s cases', (locale) => {
  const { entries } = read<Cases>('cases', locale);

  it('every case carries at least one measured outcome', () => {
    for (const entry of entries) {
      expect(entry.metrics.length, `case "${entry.id}"`).toBeGreaterThan(0);
    }
  });

  it('case ids are unique so anchors stay addressable', () => {
    const ids = entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('case ids', () => {
  it('are identical across locales so anchors survive a language switch', () => {
    const [ru, en] = LOCALES.map((locale) =>
      read<Cases>('cases', locale).entries.map((entry) => entry.id),
    );
    expect(ru).toEqual(en);
  });
});
