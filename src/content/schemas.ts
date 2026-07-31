import { z } from 'astro/zod';

const nonEmpty = z.string().min(1);

export const profileSchema = z.object({
  name: nonEmpty,
  manLine: nonEmpty,
  summary: z.array(nonEmpty).min(1).max(3),
  inlineStack: z.array(nonEmpty).min(1),
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
        title: nonEmpty,
        problem: nonEmpty,
        action: nonEmpty,
        result: nonEmpty,
      }),
    )
    .min(1)
    .max(3),
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

export const uiSchema = z.object({
  siteTitle: nonEmpty,
  metaDescription: nonEmpty,
  sections: z.object({
    name: nonEmpty,
    experience: nonEmpty,
    education: nonEmpty,
    cases: nonEmpty,
    stack: nonEmpty,
    contact: nonEmpty,
  }),
  caseLabels: z.object({
    problem: nonEmpty,
    action: nonEmpty,
    result: nonEmpty,
  }),
  controls: z.object({
    switchLanguage: nonEmpty,
    switchToDark: nonEmpty,
    switchToLight: nonEmpty,
    otherLanguageName: nonEmpty,
  }),
});
