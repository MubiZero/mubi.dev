import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

const LOCALES = ['ru', 'en'] as const;

function read<T>(collection: string, locale: string): T {
  return load(readFileSync(`src/content/${collection}/${locale}.yaml`, 'utf8')) as T;
}

type Cases = { entries: { id: string; result: string }[] };

describe.each(LOCALES)('%s cases', (locale) => {
  const { entries } = read<Cases>('cases', locale);

  // The numbers that used to sit beside each case are gone; the outcome now
  // lives in the prose, so that is where it has to actually be present.
  it('every case states an outcome', () => {
    for (const entry of entries) {
      expect(entry.result?.trim(), `case "${entry.id}"`).toBeTruthy();
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
