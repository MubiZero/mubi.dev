import { describe, expect, it } from 'vitest';
import {
  casesSchema,
  contactSchema,
  educationSchema,
  experienceSchema,
  profileSchema,
  stackSchema,
  uiSchema,
} from '../../src/content/schemas';

describe('profileSchema', () => {
  const valid = {
    name: 'Mubinjon Mukhamedov',
    manLine: 'mubi - infrastructure engineer and product developer',
    summary: ['First sentence.', 'Second sentence.'],
    now: { role: 'Middle DevOps/SRE', employer: 'Eskhata Bank', location: 'Dushanbe' },
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

  it('rejects a profile without the current role', () => {
    const { now, ...withoutNow } = valid;
    expect(() => profileSchema.parse(withoutNow)).toThrow();
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
      printEntries: [
        {
          period: '2022 - now',
          employer: 'Bank Eskhata',
          role: 'Infrastructure engineer',
          lines: ['Automated a production workflow.'],
        },
      ],
    };
    expect(experienceSchema.parse(value)).toEqual(value);
  });
});

describe('educationSchema', () => {
  it('accepts a complete education entry', () => {
    const value = {
      entries: [
        {
          degree: "Bachelor's degree in Computer Software Engineering",
          institution: 'Moscow Financial and Industrial University',
          period: 'Sep 2021 - Dec 2025',
          details: ['CTF Club'],
        },
      ],
    };
    expect(educationSchema.parse(value)).toEqual(value);
  });

  it('rejects an education entry without an institution', () => {
    expect(() =>
      educationSchema.parse({
        entries: [{ degree: 'Bachelor', period: '2021 - 2025', details: [] }],
      }),
    ).toThrow();
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

describe('casesSchema', () => {
  const valid = {
    entries: [
      {
        id: 'proxy-outage-recovery',
        title: 'Proxy outage recovery',
        problem: 'The proxy silently dropped traffic under load.',
        action: 'Rebuilt the routing rules and added health checks.',
        result: 'Zero unplanned downtime since.',
      },
    ],
  };

  it('accepts a complete cases entry', () => {
    expect(casesSchema.parse(valid)).toEqual(valid);
  });

  it('rejects an entry missing the result', () => {
    const { result, ...withoutResult } = valid.entries[0];
    expect(() => casesSchema.parse({ entries: [withoutResult] })).toThrow();
  });

  it('rejects an entry with an empty problem string', () => {
    expect(() =>
      casesSchema.parse({ entries: [{ ...valid.entries[0], problem: '' }] }),
    ).toThrow();
  });

  it('rejects more than three entries', () => {
    const fourEntries = [valid.entries[0], valid.entries[0], valid.entries[0], valid.entries[0]];
    expect(() => casesSchema.parse({ entries: fourEntries })).toThrow();
  });
});

describe('stackSchema', () => {
  const valid = {
    groups: [{ label: 'infrastructure', items: ['Linux', 'Docker', 'HAProxy'] }],
  };

  it('accepts a complete stack', () => {
    expect(stackSchema.parse(valid)).toEqual(valid);
  });

  it('rejects a group with no items', () => {
    expect(() =>
      stackSchema.parse({ groups: [{ label: 'infrastructure', items: [] }] }),
    ).toThrow();
  });

  it('rejects a group missing a label', () => {
    expect(() => stackSchema.parse({ groups: [{ items: ['Linux'] }] })).toThrow();
  });
});

describe('uiSchema', () => {
  const valid = {
    siteTitle: 'Mubinjon Mukhamedov, infrastructure engineer',
    metaDescription: 'Infrastructure engineer and product developer.',
    controls: {
      switchLanguage: 'Switch language',
      switchToDark: 'Switch to dark theme',
      switchToLight: 'Switch to light theme',
      otherLanguageName: 'Русский',
    },
  };

  it('accepts a complete ui object', () => {
    expect(uiSchema.parse(valid)).toEqual(valid);
  });

  it('rejects ui data missing the document description', () => {
    const { metaDescription, ...withoutDescription } = valid;
    expect(() => uiSchema.parse(withoutDescription)).toThrow();
  });

  it('rejects ui data with an empty control label', () => {
    expect(() =>
      uiSchema.parse({ ...valid, controls: { ...valid.controls, switchLanguage: '' } }),
    ).toThrow();
  });
});
