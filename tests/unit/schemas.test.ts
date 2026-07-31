import { describe, expect, it } from 'vitest';
import { contactSchema, experienceSchema, profileSchema } from '../../src/content/schemas';

describe('profileSchema', () => {
  const valid = {
    name: 'Mubinjon Mukhamedov',
    manLine: 'mubi - infrastructure engineer and product developer',
    summary: ['First sentence.', 'Second sentence.'],
    inlineStack: ['Linux', 'Docker'],
    ctaLabel: 'Get in touch',
  };

  it('accepts a complete profile', () => {
    expect(profileSchema.parse(valid)).toEqual(valid);
  });

  it('rejects a profile with no summary sentences', () => {
    expect(() => profileSchema.parse({ ...valid, summary: [] })).toThrow();
  });

  it('rejects a profile missing the man line', () => {
    const { manLine, ...withoutManLine } = valid;
    expect(() => profileSchema.parse(withoutManLine)).toThrow();
  });
});

describe('experienceSchema', () => {
  it('rejects an entry without a period', () => {
    expect(() =>
      experienceSchema.parse({
        entries: [{ employer: 'Bank Eskhata', role: 'Infrastructure engineer', lines: ['Scope.'] }],
      }),
    ).toThrow();
  });

  it('accepts a complete entry', () => {
    const value = {
      entries: [
        {
          period: '2022 - now',
          employer: 'Bank Eskhata',
          role: 'Infrastructure engineer',
          lines: ['Proxy layer, identity, container platform.'],
        },
      ],
    };
    expect(experienceSchema.parse(value)).toEqual(value);
  });
});

describe('contactSchema', () => {
  it('rejects a malformed email', () => {
    expect(() =>
      contactSchema.parse({ email: 'not-an-email', links: [] }),
    ).toThrow();
  });

  it('rejects a link without an absolute url', () => {
    expect(() =>
      contactSchema.parse({
        email: 'someone@example.com',
        links: [{ label: 'GitHub', url: 'github.com/handle' }],
      }),
    ).toThrow();
  });
});
