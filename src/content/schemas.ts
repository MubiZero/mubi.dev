import { z } from 'astro/zod';

const nonEmpty = z.string().min(1);

export const profileSchema = z.object({
  name: nonEmpty,
  manLine: nonEmpty,
  summary: z.array(nonEmpty).min(1).max(3),
  now: z.object({
    role: nonEmpty,
    employer: nonEmpty,
    location: nonEmpty,
  }),
  ctaLabel: nonEmpty,
});

export const experienceSchema = z.object({
  entries: z
    .array(
      z.object({
        period: nonEmpty,
        employer: nonEmpty,
        role: nonEmpty,
        lines: z.array(nonEmpty).min(1).max(3),
      }),
    )
    .min(1),
  printEntries: z
    .array(
      z.object({
        period: nonEmpty,
        employer: nonEmpty,
        role: nonEmpty,
        lines: z.array(nonEmpty).min(1).max(3),
      }),
    )
    .min(1),
});

export const educationSchema = z.object({
  entries: z
    .array(
      z.object({
        degree: nonEmpty,
        institution: nonEmpty,
        period: nonEmpty,
        details: z.array(nonEmpty).max(2),
      }),
    )
    .min(1)
    .max(2),
});

export const casesSchema = z.object({
  entries: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'case id must be a lowercase slug'),
        title: nonEmpty,
        problem: nonEmpty,
        action: nonEmpty,
        result: nonEmpty,
      }),
    )
    .min(1)
    .max(3),
});

export const reposSchema = z.object({
  entries: z
    .array(
      z.object({
        repo: z.string().min(1),
        title: nonEmpty,
        description: nonEmpty,
      }),
    )
    .min(1)
    .max(6),
});

export const stackSchema = z.object({
  groups: z
    .array(
      z.object({
        label: nonEmpty,
        items: z.array(nonEmpty).min(1),
      }),
    )
    .min(1),
});

export const contactSchema = z.object({
  email: z.string().email(),
  links: z.array(
    z.object({
      label: nonEmpty,
      url: z.string().url(),
    }),
  ),
});

export const copySchema = z.object({
  mark: nonEmpty,
  lead: nonEmpty,
  availability: nonEmpty,
  // The measured outcomes the cases below prove, stated where a reader who
  // never scrolls still sees them. Two or three, never a wall.
  proof: z.array(z.object({ metric: nonEmpty, label: nonEmpty })).min(2).max(3),
  nav: z.object({
    label: nonEmpty,
    open: nonEmpty,
    close: nonEmpty,
    practice: nonEmpty,
    work: nonEmpty,
    track: nonEmpty,
    code: nonEmpty,
    contact: nonEmpty,
  }),
  sections: z.object({
    practice: z.object({
      title: nonEmpty,
      rail: nonEmpty,
      items: z.array(z.object({ title: nonEmpty, description: nonEmpty })).length(3),
    }),
    work: z.object({ title: nonEmpty, rail: nonEmpty }),
    track: z.object({ title: nonEmpty, rail: nonEmpty }),
    toolkit: z.object({ title: nonEmpty, rail: nonEmpty }),
    code: z.object({
      title: nonEmpty,
      rail: nonEmpty,
      // every plural form the locale needs, so the yearly total can be stated
      // correctly whatever number the build happens to read
      contributions: z.object({
        one: nonEmpty,
        few: nonEmpty,
        many: nonEmpty,
        other: nonEmpty,
      }),
      calendarHint: nonEmpty,
      // a pointer hint is a lie on a touch screen, so each input gets its own
      calendarHintTouch: nonEmpty,
    }),
    contact: z.object({
      title: nonEmpty,
      rail: nonEmpty,
      lead: nonEmpty,
      action: nonEmpty,
      copy: nonEmpty,
      copied: nonEmpty,
      copyFailed: nonEmpty,
    }),
  }),
  caseLabels: z.object({ context: nonEmpty, action: nonEmpty, result: nonEmpty }),
  printLabel: nonEmpty,
  educationTitle: nonEmpty,
  skipToContent: nonEmpty,
});

export const uiSchema = z.object({
  siteTitle: nonEmpty,
  metaDescription: nonEmpty,
  controls: z.object({
    switchLanguage: nonEmpty,
    switchToDark: nonEmpty,
    switchToLight: nonEmpty,
    otherLanguageName: nonEmpty,
  }),
});
