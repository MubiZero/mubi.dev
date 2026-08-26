import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import {
  casesSchema,
  contactSchema,
  copySchema,
  educationSchema,
  experienceSchema,
  profileSchema,
  reposSchema,
  stackSchema,
  uiSchema,
} from '../../src/content/schemas';

/**
 * schemas.test.ts proves the schemas accept and reject the right shapes, but
 * it does so against literals written inside the test. Until this file existed
 * the published YAML was only ever checked by `astro build`, so `npm test`
 * could be green on content the build would refuse.
 */
const SCHEMAS = {
  profile: profileSchema,
  experience: experienceSchema,
  education: educationSchema,
  cases: casesSchema,
  stack: stackSchema,
  contact: contactSchema,
  repos: reposSchema,
  ui: uiSchema,
  copy: copySchema,
} as const;

const LOCALES = ['en', 'ru'] as const;

describe.each(Object.entries(SCHEMAS))('%s content', (collection, schema) => {
  it.each(LOCALES)('matches its schema in %s', (locale) => {
    const raw = load(readFileSync(`src/content/${collection}/${locale}.yaml`, 'utf8'));
    const result = schema.safeParse(raw);
    expect(
      result.success ? null : JSON.stringify(result.error.issues, null, 2),
    ).toBeNull();
  });
});
