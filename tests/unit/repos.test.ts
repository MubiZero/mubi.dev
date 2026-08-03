import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import snapshot from '../../src/data/github-snapshot.json';

const LOCALES = ['ru', 'en'] as const;

type Repos = { entries: { repo: string; title: string; description: string }[] };

function read(locale: string): Repos {
  return load(readFileSync(`src/content/repos/${locale}.yaml`, 'utf8')) as Repos;
}

describe.each(LOCALES)('%s repositories', (locale) => {
  const { entries } = read(locale);

  it('name a repository the fallback snapshot knows', () => {
    const known = new Set(snapshot.map((repo) => repo.name));
    for (const entry of entries) {
      expect(known.has(entry.repo), entry.repo).toBe(true);
    }
  });

  it('are listed once each', () => {
    const names = entries.map((entry) => entry.repo);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('repositories across locales', () => {
  it('list the same projects in the same order', () => {
    const [ru, en] = LOCALES.map((locale) => read(locale).entries.map((entry) => entry.repo));
    expect(ru).toEqual(en);
  });

  it('describe each project in its own words, not by copying the other locale', () => {
    const [ru, en] = LOCALES.map((locale) => read(locale).entries);
    ru.forEach((entry, index) => {
      expect(entry.description, entry.repo).not.toBe(en[index].description);
    });
  });
});

describe('the committed GitHub snapshot', () => {
  it('carries the fields the page renders', () => {
    expect(snapshot.length).toBeGreaterThan(0);
    for (const repo of snapshot) {
      expect(repo.url).toMatch(/^https:\/\/github\.com\//);
      expect(Number.isNaN(Date.parse(repo.pushedAt)), repo.name).toBe(false);
    }
  });
});
