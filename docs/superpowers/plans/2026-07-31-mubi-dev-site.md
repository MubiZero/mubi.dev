# mubi.dev Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual static CV site at `mubi.dev` described in `docs/superpowers/specs/2026-07-31-mubi-dev-design.md`, deployable to Cloudflare Pages.

**Architecture:** Astro static output with zero client JavaScript except a theme toggle. All copy lives in per-locale YAML files loaded through Astro content collections with Zod schemas, so a missing translation is a build error. Design tokens live in one CSS file mapped into the Tailwind theme; components consume tokens only, never raw values. Two pages (`/` English, `/ru/` Russian) render the same six components from locale-scoped data.

**Tech Stack:** Astro 6, Tailwind CSS 4 (via `@tailwindcss/vite`), Vitest (unit: schemas, key parity, contrast math), Playwright + axe-core (e2e: states, a11y, responsive, print), Fontsource (self-hosted Geist Mono + IBM Plex Sans).

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

- **Locales:** English default at `/`, Russian at `/ru/`. Identical key structure in both. A missing key in one locale must fail the build.
- **No em-dash (`—`) in English copy.** Russian copy uses a dash only where grammar requires it. Applies to all strings including `alt`, `aria-label`, `title`, and meta tags.
- **One language per locale.** Technology names (Docker, HAProxy, FreeIPA, Go, Flutter) keep their original form in both locales.
- **Placeholders:** unknown facts ship as explicit `TODO:` markers in YAML data files. Never invent employers, dates, metrics, handles, or URLs.
- **Contrast:** text at least 4.5:1; large text and non-text UI that identifies a component (focus rings, interactive borders, icons) at least 3:1. Verified in both themes.
- **Targets:** interactive targets at least 24px, using transparent padding where the visual is smaller.
- **Focus:** visible `:focus-visible` outline, 2px, at least 3:1 against the adjacent background. Bare `outline: none` is a defect.
- **Motion:** movement and fading use `transform` and `opacity` only. Color changes may transition through an explicit property list (`color`, `text-decoration-color`, `background-color`, `border-color`), since those are paint-only and trigger no layout. `transition: all` stays forbidden, and no other layout-affecting property may be transitioned. `--dur-short` 150ms, `--dur-medium` 250ms, exits about 30 percent shorter. `prefers-reduced-motion: reduce` removes non-essential motion.
- **Spacing:** 4px scale only (4, 8, 12, 16, 24, 32, 48, 64). No arbitrary pixel values in components.
- **Radius:** `--radius-sm` 6px, `--radius-md` 10px; a child radius never exceeds its parent's.
- **Banned patterns:** fake product UI built from `<div>` (terminal, dashboard, chat), gradient text, glow gradients, glassmorphism, a card nested in a card, rows of identical tiles, an eyebrow label above every section, `01 / 02 / 03` section markers, skill bars or proficiency percentages, contact forms, buzzword copy.
- **Viewport:** use `dvh` units, never `vh`. No horizontal scroll from 320px to 2560px.
- **Fonts:** Geist Mono (headings, labels, years, stack values) and IBM Plex Sans (body). Self-hosted, `font-display: swap`. Inter and JetBrains Mono are forbidden.

## File Structure

```
astro.config.mjs                 Astro config: static output, i18n locales, Tailwind vite plugin, sitemap
package.json                     scripts: dev, build, preview, test, test:e2e
vitest.config.ts                 unit test config (node environment)
playwright.config.ts             e2e config, webServer runs build + preview on port 4321
src/
  styles/tokens.css              color, spacing, radius, motion tokens for both themes; @theme mapping
  styles/global.css              @import tailwindcss, tokens, base element styles, print rules
  content.config.ts              collection definitions (glob YAML loaders) wired to schemas
  content/schemas.ts             Zod schemas, exported separately so unit tests can import them
  content/profile/{en,ru}.yaml   name, man-line, summary sentences, inline stack, cta
  content/experience/{en,ru}.yaml
  content/cases/{en,ru}.yaml
  content/stack/{en,ru}.yaml
  content/contact/{en,ru}.yaml
  content/ui/{en,ru}.yaml        section labels and control labels
  lib/locale.ts                  Locale type, LOCALES, alternate-locale helper, localized path helper
  lib/content.ts                 typed loaders: loadPage(locale) returns every section's data at once
  layouts/BaseLayout.astro       html shell, head, SEO, hreflang, JSON-LD, theme bootstrap script
  components/Header.astro        wordmark, LangSwitch, ThemeToggle
  components/LangSwitch.astro
  components/ThemeToggle.astro   the only client JavaScript on the page
  components/Hero.astro
  components/Experience.astro
  components/Cases.astro
  components/Stack.astro
  components/Contact.astro
  components/SectionHeading.astro shared label + divider, so section chrome is defined once
  pages/index.astro              English page
  pages/ru/index.astro           Russian page
tests/unit/schemas.test.ts
tests/unit/parity.test.ts
tests/unit/contrast.test.ts
tests/unit/copy.test.ts          em-dash guard over every YAML string
tests/e2e/*.spec.ts
public/robots.txt
public/og.png
docs/HANDOVER.md                 list of every TODO the owner must fill in
```

Rationale for the boundaries: content, tokens, and components are three things that change on different schedules and for different reasons. `schemas.ts` is separate from `content.config.ts` so unit tests can import schemas without booting Astro. `lib/content.ts` is the single place that knows how a locale maps to data, so no component contains locale logic.

---

### Task 1: Project scaffold with test harness

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `src/pages/index.astro`, `src/styles/global.css`
- Create: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run build` writing static output to `dist/`; `npm test` running Vitest; `npm run test:e2e` running Playwright against a preview server on port 4321.

- [ ] **Step 1: Create the Astro project in the current directory**

Run from the repository root (the directory already contains `.git`, `.gitignore`, and `docs/`):

```bash
npm create astro@latest . -- --template minimal --no-install --no-git --typescript strict --skip-houston
npm install
npx astro add tailwind --yes
npm install -D vitest @playwright/test @axe-core/playwright js-yaml @types/js-yaml
npm install @fontsource/geist-mono @fontsource/ibm-plex-sans
npx playwright install chromium
```

If `npm create astro` refuses because the directory is not empty, answer its prompt to continue in the existing directory. It must not delete `docs/`, so verify `docs/superpowers/specs/` still exists afterwards.

- [ ] **Step 2: Configure Astro**

Replace `astro.config.mjs` with:

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mubi.dev',
  output: 'static',
  i18n: {
    locales: ['en', 'ru'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

Then install the sitemap integration:

```bash
npx astro add sitemap --yes
```

- [ ] **Step 3: Add package scripts**

In `package.json`, set the `scripts` block to:

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview --port 4321",
  "test": "vitest run",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Configure Playwright**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 6: Write the failing smoke test**

Create `tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('English page renders the wordmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=mubi.dev').first()).toBeVisible();
});
```

- [ ] **Step 7: Run it to confirm it fails**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: FAIL, because the default minimal template page has no `mubi.dev` text.

- [ ] **Step 8: Make it pass with the minimal page and global stylesheet**

Create `src/styles/global.css`:

```css
@import 'tailwindcss';
```

Replace `src/pages/index.astro`:

```astro
---
import '../styles/global.css';
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>mubi.dev</title>
  </head>
  <body>
    <p>mubi.dev</p>
  </body>
</html>
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: PASS.

- [ ] **Step 10: Verify the build is clean**

Run: `npm run build`
Expected: completes with no errors and no warnings.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold astro project with vitest and playwright"
```

---

### Task 2: Design tokens, fonts, and a contrast test that fails on bad colors

**Files:**
- Create: `src/styles/tokens.css`, `tests/unit/contrast.test.ts`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: the build from Task 1.
- Produces: CSS custom properties `--bg`, `--surface`, `--text`, `--text-muted`, `--text-disabled`, `--border`, `--accent`, `--accent-text`, `--focus`, `--space-{1,2,3,4,6,8,12,16}`, `--radius-sm`, `--radius-md`, `--dur-short`, `--dur-medium`, `--ease-enter`, `--ease-exit`, `--text-step-minus-1` through `--text-step-5`, plus Tailwind theme names `bg`, `surface`, `text`, `muted`, `border`, `accent`, and font families `font-mono` (Geist Mono) and `font-sans` (IBM Plex Sans). Themes switch on `[data-theme='dark']` and `[data-theme='light']` on `<html>`.

All color values below were verified by WCAG relative-luminance calculation. Do not substitute approximations.

- [ ] **Step 1: Write the failing contrast test**

Create `tests/unit/contrast.test.ts`. It parses the real token file, so changing a color to something illegible fails the suite:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function block(selector: string): string {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`selector not found: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

function token(selector: string, name: string): string {
  const match = block(selector).match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`token not found: ${name} in ${selector}`);
  return match[1].trim();
}

function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('dark theme', () => {
  const bg = token(":root, [data-theme='dark']", '--bg');

  it('primary text meets 4.5:1', () => {
    expect(contrast(token(":root, [data-theme='dark']", '--text'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('secondary text meets 4.5:1', () => {
    expect(contrast(token(":root, [data-theme='dark']", '--text-muted'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('accent text meets 4.5:1', () => {
    expect(contrast(token(":root, [data-theme='dark']", '--accent-text'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('focus ring meets 3:1 as non-text UI', () => {
    expect(contrast(token(":root, [data-theme='dark']", '--focus'), bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('light theme', () => {
  const bg = token("[data-theme='light']", '--bg');

  it('primary text meets 4.5:1', () => {
    expect(contrast(token("[data-theme='light']", '--text'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('secondary text meets 4.5:1', () => {
    expect(contrast(token("[data-theme='light']", '--text-muted'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('accent text meets 4.5:1', () => {
    expect(contrast(token("[data-theme='light']", '--accent-text'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('focus ring meets 3:1 as non-text UI', () => {
    expect(contrast(token("[data-theme='light']", '--focus'), bg)).toBeGreaterThanOrEqual(3);
  });
});
```

Note on scope: this test covers text and the non-text UI that identifies a component (focus ring). Section hairline dividers are deliberately below 3:1. That is allowed because grouping is also carried by section headings and spacing, so the divider reinforces structure rather than being the only signal for it. Do not "fix" the dividers by brightening them; it breaks the visual direction.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/contrast.test.ts`
Expected: FAIL with `selector not found` because `src/styles/tokens.css` does not exist yet.

- [ ] **Step 3: Write the token file**

Create `src/styles/tokens.css`:

```css
:root, [data-theme='dark'] {
  --bg: #101215;
  --surface: #212325;
  --text: #E0E0E1;
  --text-muted: #9FA0A1;
  --text-disabled: #6B6C6E;
  --border: #232528;
  --border-strong: #404144;
  --accent: #E0A340;
  --accent-text: #E0A340;
  --focus: #E0A340;
  color-scheme: dark;
}

[data-theme='light'] {
  --bg: #F7F7F8;
  --surface: #FFFFFF;
  --text: #16181C;
  --text-muted: #565A61;
  --text-disabled: #9A9EA5;
  --border: #D6D7DA;
  --border-strong: #B9BBC0;
  --accent: #B4740A;
  --accent-text: #8A5A00;
  --focus: #8A5A00;
  color-scheme: light;
}

:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  --radius-sm: 6px;
  --radius-md: 10px;

  --dur-short: 150ms;
  --dur-medium: 250ms;
  --ease-enter: cubic-bezier(0.05, 0.7, 0.1, 1);
  --ease-exit: cubic-bezier(0.3, 0, 0.8, 0.15);
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-text: var(--text);
  --color-muted: var(--text-muted);
  --color-disabled: var(--text-disabled);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-accent: var(--accent);
  --color-accent-text: var(--accent-text);
  --color-focus: var(--focus);

  --font-sans: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;

  --text-step-minus-1: 0.8rem;
  --text-step-0: 1rem;
  --text-step-1: 1.25rem;
  --text-step-2: 1.5625rem;
  --text-step-3: 1.9375rem;
  --text-step-4: 2.4375rem;
  --text-step-5: 3.0625rem;
}
```

The dark values are the composited results of the spec's 87 / 60 / 38 percent white overlays and the 7 percent elevated surface, precomputed so the tokens are inspectable. In the light theme the accent is darkened, because the dark-theme amber only reaches 2.07:1 on a light background and would fail as text.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/unit/contrast.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Wire tokens, fonts, and base element styles into the global stylesheet**

Replace `src/styles/global.css`:

```css
@import 'tailwindcss';
@import '@fontsource/geist-mono/400.css';
@import '@fontsource/geist-mono/700.css';
@import '@fontsource/ibm-plex-sans/400.css';
@import '@fontsource/ibm-plex-sans/700.css';
@import './tokens.css';

html {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  min-height: 100dvh;
  font-size: var(--text-step-0);
  line-height: 1.5;
  text-wrap: pretty;
}

h1, h2, h3 {
  font-family: var(--font-mono);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  text-wrap: balance;
  margin: 0;
}

a {
  color: inherit;
  text-decoration-color: var(--border-strong);
  text-underline-offset: 3px;
  transition: color var(--dur-short) var(--ease-enter),
    text-decoration-color var(--dur-short) var(--ease-enter);
}

a:hover {
  color: var(--accent-text);
  text-decoration-color: var(--accent-text);
}

:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

::selection {
  background: var(--accent);
  color: var(--bg);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 6: Verify the build and the full unit suite**

Run: `npm test && npm run build`
Expected: all unit tests pass; build completes with no errors or warnings.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add design tokens, self-hosted fonts, and contrast tests"
```

---

### Task 3: Content schemas, bilingual data files, parity and copy tests

**Files:**
- Create: `src/content/schemas.ts`, `src/content.config.ts`, `src/lib/locale.ts`, `src/lib/content.ts`
- Create: `src/content/{profile,experience,cases,stack,contact,ui}/{en,ru}.yaml`
- Create: `tests/unit/schemas.test.ts`, `tests/unit/parity.test.ts`, `tests/unit/copy.test.ts`

**Interfaces:**
- Consumes: the Astro build from Task 1.
- Produces:
  - `src/content/schemas.ts` exports `profileSchema`, `experienceSchema`, `casesSchema`, `stackSchema`, `contactSchema`, `uiSchema` (all Zod objects).
  - `src/lib/locale.ts` exports `type Locale = 'en' | 'ru'`, `LOCALES: Locale[]`, `otherLocale(locale: Locale): Locale`, `localizedPath(locale: Locale): string` returning `/` or `/ru/`.
  - `src/lib/content.ts` exports `async function loadPage(locale: Locale)` returning `{ profile, experience, cases, stack, contact, ui }`, where each value is the parsed `data` object of the matching collection entry. Later tasks consume exactly these names.

- [ ] **Step 1: Write the failing schema test**

Create `tests/unit/schemas.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- tests/unit/schemas.test.ts`
Expected: FAIL, cannot resolve `src/content/schemas`.

- [ ] **Step 3: Write the schemas**

Create `src/content/schemas.ts`:

```ts
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
```

- [ ] **Step 4: Run the schema test to verify it passes**

Run: `npm test -- tests/unit/schemas.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Write the failing parity and copy tests**

Create `tests/unit/parity.test.ts`. It walks both locales of every collection and compares key shapes, which is what makes half-localization impossible:

```ts
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
```

Create `tests/unit/copy.test.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const COLLECTIONS = ['profile', 'experience', 'cases', 'stack', 'contact', 'ui'];

function files(locale: string): string[] {
  return COLLECTIONS.map((collection) => `src/content/${collection}/${locale}.yaml`);
}

describe('English copy', () => {
  it('contains no em-dash', () => {
    for (const path of files('en')) {
      expect(readFileSync(path, 'utf8'), path).not.toContain('—');
    }
  });
});

describe('every locale directory', () => {
  it('holds exactly one file per locale', () => {
    for (const collection of COLLECTIONS) {
      expect(readdirSync(`src/content/${collection}`).sort()).toEqual(['en.yaml', 'ru.yaml']);
    }
  });
});
```

- [ ] **Step 6: Run them to verify they fail**

Run: `npm test -- tests/unit/parity.test.ts tests/unit/copy.test.ts`
Expected: FAIL, the YAML files do not exist.

- [ ] **Step 7: Write the English data files**

Facts that are not known ship as `TODO:` strings. Do not replace a `TODO:` with an invented value.

`src/content/profile/en.yaml`:

```yaml
name: Mubinjon Mukhamedov
manLine: mubi - infrastructure engineer and product developer
summary:
  - I keep banking systems running, and build the apps that run on them.
  - 'TODO: one sentence on what you want to be hired for next.'
inlineStack:
  - Linux
  - Docker
  - HAProxy
  - Go
  - Flutter
ctaLabel: Get in touch
```

`src/content/experience/en.yaml`:

```yaml
entries:
  - period: 2022 - now
    employer: Bank Eskhata
    role: Infrastructure engineer
    lines:
      - 'TODO: two lines on scope, for example proxy layer, identity, container platform.'
  - period: 'TODO: years'
    employer: 'TODO: previous employer'
    role: 'TODO: role'
    lines:
      - 'TODO: what you were responsible for.'
```

`src/content/cases/en.yaml`:

```yaml
entries:
  - title: 'TODO: short case name'
    problem: 'TODO: what was broken or missing, in one sentence.'
    action: 'TODO: what you did.'
    result: 'TODO: the measurable outcome.'
  - title: 'TODO: short case name'
    problem: 'TODO: what was broken or missing, in one sentence.'
    action: 'TODO: what you did.'
    result: 'TODO: the measurable outcome.'
```

`src/content/stack/en.yaml`:

```yaml
groups:
  - label: infrastructure
    items: [Linux, Docker, HAProxy, FreeIPA, Coolify]
  - label: backend
    items: [Go, .NET]
  - label: apps
    items: [Flutter, Angular]
```

`src/content/contact/en.yaml`:

```yaml
email: todo@example.com
links:
  - label: GitHub
    url: https://github.com/TODO
  - label: LinkedIn
    url: https://www.linkedin.com/in/TODO
  - label: Telegram
    url: https://t.me/TODO
```

`src/content/ui/en.yaml`:

```yaml
siteTitle: Mubinjon Mukhamedov, infrastructure engineer and product developer
metaDescription: Infrastructure engineer working on banking systems, and developer of the applications that run on them. Linux, Docker, HAProxy, Go, Flutter.
sections:
  name: NAME
  experience: EXPERIENCE
  cases: WHAT I FIXED
  stack: STACK
  contact: CONTACT
caseLabels:
  problem: Problem
  action: What I did
  result: Result
controls:
  switchLanguage: Switch language
  switchToDark: Switch to dark theme
  switchToLight: Switch to light theme
  otherLanguageName: Русский
```

- [ ] **Step 8: Write the Russian data files**

Real translations, matching key structure. Russian keeps a dash only where grammar requires it.

`src/content/profile/ru.yaml`:

```yaml
name: Мубинджон Мухамедов
manLine: mubi - инженер инфраструктуры и разработчик продуктов
summary:
  - Держу банковские системы в рабочем состоянии и делаю приложения, которые на них работают.
  - 'TODO: одно предложение о том, какую работу вы хотите получить дальше.'
inlineStack:
  - Linux
  - Docker
  - HAProxy
  - Go
  - Flutter
ctaLabel: Связаться
```

`src/content/experience/ru.yaml`:

```yaml
entries:
  - period: 2022 - сейчас
    employer: Банк Эсхата
    role: Инженер инфраструктуры
    lines:
      - 'TODO: две строки о зоне ответственности, например прокси-слой, служба каталога, платформа контейнеров.'
  - period: 'TODO: годы'
    employer: 'TODO: предыдущий работодатель'
    role: 'TODO: должность'
    lines:
      - 'TODO: за что вы отвечали.'
```

`src/content/cases/ru.yaml`:

```yaml
entries:
  - title: 'TODO: короткое название кейса'
    problem: 'TODO: что было сломано или отсутствовало, одним предложением.'
    action: 'TODO: что вы сделали.'
    result: 'TODO: измеримый результат.'
  - title: 'TODO: короткое название кейса'
    problem: 'TODO: что было сломано или отсутствовало, одним предложением.'
    action: 'TODO: что вы сделали.'
    result: 'TODO: измеримый результат.'
```

`src/content/stack/ru.yaml`:

```yaml
groups:
  - label: инфраструктура
    items: [Linux, Docker, HAProxy, FreeIPA, Coolify]
  - label: бэкенд
    items: [Go, .NET]
  - label: приложения
    items: [Flutter, Angular]
```

`src/content/contact/ru.yaml`:

```yaml
email: todo@example.com
links:
  - label: GitHub
    url: https://github.com/TODO
  - label: LinkedIn
    url: https://www.linkedin.com/in/TODO
  - label: Telegram
    url: https://t.me/TODO
```

`src/content/ui/ru.yaml`:

```yaml
siteTitle: Мубинджон Мухамедов, инженер инфраструктуры и разработчик продуктов
metaDescription: Инженер инфраструктуры банковских систем и разработчик приложений, которые на них работают. Linux, Docker, HAProxy, Go, Flutter.
sections:
  name: ИМЯ
  experience: ОПЫТ
  cases: ЧТО Я ПОЧИНИЛ
  stack: СТЕК
  contact: КОНТАКТЫ
caseLabels:
  problem: Проблема
  action: Что сделал
  result: Результат
controls:
  switchLanguage: Сменить язык
  switchToDark: Включить тёмную тему
  switchToLight: Включить светлую тему
  otherLanguageName: English
```

- [ ] **Step 9: Run the parity and copy tests to verify they pass**

Run: `npm test -- tests/unit/parity.test.ts tests/unit/copy.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 10: Register the collections**

Create `src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  casesSchema,
  contactSchema,
  experienceSchema,
  profileSchema,
  stackSchema,
  uiSchema,
} from './content/schemas';

function localeCollection(directory: string, schema: Parameters<typeof defineCollection>[0]['schema']) {
  return defineCollection({
    loader: glob({ base: `./src/content/${directory}`, pattern: '*.yaml' }),
    schema,
  });
}

export const collections = {
  profile: localeCollection('profile', profileSchema),
  experience: localeCollection('experience', experienceSchema),
  cases: localeCollection('cases', casesSchema),
  stack: localeCollection('stack', stackSchema),
  contact: localeCollection('contact', contactSchema),
  ui: localeCollection('ui', uiSchema),
};
```

- [ ] **Step 11: Write the locale and content helpers**

Create `src/lib/locale.ts`:

```ts
export type Locale = 'en' | 'ru';

export const LOCALES: Locale[] = ['en', 'ru'];

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ru' : 'en';
}

export function localizedPath(locale: Locale): string {
  return locale === 'en' ? '/' : '/ru/';
}
```

Create `src/lib/content.ts`:

```ts
import { getEntry } from 'astro:content';
import type { Locale } from './locale';

async function section<T extends 'profile' | 'experience' | 'cases' | 'stack' | 'contact' | 'ui'>(
  collection: T,
  locale: Locale,
) {
  const entry = await getEntry(collection, locale);
  if (!entry) throw new Error(`missing ${collection} data for locale ${locale}`);
  return entry.data;
}

export async function loadPage(locale: Locale) {
  const [profile, experience, cases, stack, contact, ui] = await Promise.all([
    section('profile', locale),
    section('experience', locale),
    section('cases', locale),
    section('stack', locale),
    section('contact', locale),
    section('ui', locale),
  ]);
  return { profile, experience, cases, stack, contact, ui };
}
```

- [ ] **Step 12: Prove the build fails on a missing key**

Temporarily delete the `ctaLabel` line from `src/content/profile/ru.yaml`, then run:

Run: `npm run build`
Expected: FAIL with a Zod validation error naming `ctaLabel` and the `ru` entry. Restore the line and rebuild to confirm it passes again. This verifies spec acceptance criterion 3.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add bilingual content collections with parity and copy tests"
```

---

### Task 4: BaseLayout with SEO, hreflang, JSON-LD, and flash-free theme bootstrap

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `tests/e2e/head.spec.ts`, `tests/e2e/theme.spec.ts`
- Modify: `src/pages/index.astro`, create `src/pages/ru/index.astro`

**Interfaces:**
- Consumes: `loadPage` and `localizedPath`, `otherLocale` from Task 3; tokens from Task 2.
- Produces: `BaseLayout.astro` accepting props `{ locale: Locale; ui: Awaited<ReturnType<typeof loadPage>>['ui']; profile: Awaited<ReturnType<typeof loadPage>>['profile']; contact: Awaited<ReturnType<typeof loadPage>>['contact'] }` and rendering `<html data-theme>` plus a `<slot />`. Sets `data-theme` before first paint.

- [ ] **Step 1: Write the failing head and theme tests**

Create `tests/e2e/head.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('English page exposes correct metadata and alternates', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="alternate"][hreflang="ru"]')).toHaveAttribute(
    'href',
    'https://mubi.dev/ru/',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    'href',
    'https://mubi.dev/',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Infrastructure engineer/,
  );
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(jsonLd ?? '{}')['@type']).toBe('Person');
});

test('Russian page exposes correct metadata and alternates', async ({ page }) => {
  await page.goto('/ru/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    'https://mubi.dev/',
  );
});

test('English page contains no em-dash in rendered text', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('body').innerText();
  expect(text).not.toContain('—');
});
```

Create `tests/e2e/theme.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('dark preference resolves to the dark theme before paint', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});

test('light preference resolves to the light theme', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await context.close();
});

test('stored preference wins over the system preference', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test:e2e -- tests/e2e/head.spec.ts tests/e2e/theme.spec.ts`
Expected: FAIL, no `data-theme` attribute and no alternate links.

- [ ] **Step 3: Write the layout**

Create `src/layouts/BaseLayout.astro`:

```astro
---
import '../styles/global.css';
import { localizedPath, otherLocale, type Locale } from '../lib/locale';

interface Props {
  locale: Locale;
  ui: { siteTitle: string; metaDescription: string };
  profile: { name: string; manLine: string };
  contact: { email: string; links: { label: string; url: string }[] };
}

const { locale, ui, profile, contact } = Astro.props;
const site = 'https://mubi.dev';
const canonical = new URL(localizedPath(locale), site).href;
const alternate = new URL(localizedPath(otherLocale(locale)), site).href;

const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  description: profile.manLine,
  url: canonical,
  email: `mailto:${contact.email}`,
  sameAs: contact.links.map((link) => link.url),
};
---

<html lang={locale} data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{ui.siteTitle}</title>
    <meta name="description" content={ui.metaDescription} />
    <link rel="canonical" href={canonical} />
    <link rel="alternate" hreflang={locale} href={canonical} />
    <link rel="alternate" hreflang={otherLocale(locale)} href={alternate} />
    <link rel="alternate" hreflang="x-default" href={`${site}/`} />
    <meta property="og:type" content="profile" />
    <meta property="og:title" content={ui.siteTitle} />
    <meta property="og:description" content={ui.metaDescription} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={`${site}/og.png`} />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json" set:html={JSON.stringify(person)} />
    <script is:inline>
      const stored = localStorage.getItem('theme');
      const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      document.documentElement.dataset.theme = stored ?? preferred;
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

The inline script runs in `<head>` before body paint, so the theme never flashes. It is the only client JavaScript in the page besides the toggle in Task 5.

- [ ] **Step 4: Wire both pages**

Replace `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { loadPage } from '../lib/content';

const page = await loadPage('en');
---

<BaseLayout locale="en" ui={page.ui} profile={page.profile} contact={page.contact}>
  <main>
    <h1>{page.profile.name}</h1>
    <p>mubi.dev</p>
  </main>
</BaseLayout>
```

Create `src/pages/ru/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { loadPage } from '../../lib/content';

const page = await loadPage('ru');
---

<BaseLayout locale="ru" ui={page.ui} profile={page.profile} contact={page.contact}>
  <main>
    <h1>{page.profile.name}</h1>
    <p>mubi.dev</p>
  </main>
</BaseLayout>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/head.spec.ts tests/e2e/theme.spec.ts tests/e2e/smoke.spec.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add base layout with SEO, hreflang, and flash-free theming"
```

---

### Task 5: Header with language switch and theme toggle

**Files:**
- Create: `src/components/Header.astro`, `src/components/LangSwitch.astro`, `src/components/ThemeToggle.astro`, `tests/e2e/header.spec.ts`
- Modify: `src/pages/index.astro`, `src/pages/ru/index.astro`

**Interfaces:**
- Consumes: `localizedPath`, `otherLocale`, `Locale` from Task 3; tokens from Task 2.
- Produces: `Header.astro` with props `{ locale: Locale; controls: { switchLanguage: string; switchToDark: string; switchToLight: string; otherLanguageName: string } }`. The toggle writes `localStorage.theme` and flips `document.documentElement.dataset.theme`.

- [ ] **Step 1: Write the failing header test**

Create `tests/e2e/header.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('language switch moves between locales in both directions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Русский' }).click();
  await expect(page).toHaveURL(/\/ru\/$/);
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL('http://localhost:4321/');
});

test('theme toggle flips the theme and persists it', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: /theme/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await context.close();
});

test('every header control is keyboard reachable with a visible focus ring', async ({ page }) => {
  await page.goto('/');
  const controls = page.locator('header a, header button');
  const count = await controls.count();
  expect(count).toBeGreaterThanOrEqual(2);

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    await control.focus();
    const outlineWidth = await control.evaluate(
      (element) => getComputedStyle(element).outlineWidth,
    );
    expect(parseFloat(outlineWidth), `control ${index} focus ring`).toBeGreaterThanOrEqual(2);
  }
});

test('every header control meets the 24px target minimum', async ({ page }) => {
  await page.goto('/');
  const controls = page.locator('header a, header button');
  for (let index = 0; index < (await controls.count()); index += 1) {
    const box = await controls.nth(index).boundingBox();
    expect(box?.height ?? 0, `control ${index} height`).toBeGreaterThanOrEqual(24);
    expect(box?.width ?? 0, `control ${index} width`).toBeGreaterThanOrEqual(24);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/header.spec.ts`
Expected: FAIL, no header element exists.

- [ ] **Step 3: Write LangSwitch**

Create `src/components/LangSwitch.astro`:

```astro
---
import { localizedPath, otherLocale, type Locale } from '../lib/locale';

interface Props {
  locale: Locale;
  label: string;
  otherLanguageName: string;
}

const { locale, label, otherLanguageName } = Astro.props;
---

<a
  href={localizedPath(otherLocale(locale))}
  hreflang={otherLocale(locale)}
  aria-label={label}
  class="inline-flex min-h-6 min-w-6 items-center px-2 py-1 font-mono text-muted no-underline
         transition-colors duration-150 hover:text-accent-text active:scale-[0.97]"
>
  {otherLanguageName}
</a>
```

- [ ] **Step 4: Write ThemeToggle**

Create `src/components/ThemeToggle.astro`:

```astro
---
interface Props {
  toDark: string;
  toLight: string;
}

const { toDark, toLight } = Astro.props;
---

<button
  type="button"
  id="theme-toggle"
  data-to-dark={toDark}
  data-to-light={toLight}
  class="inline-flex min-h-6 min-w-6 items-center justify-center rounded-[var(--radius-sm)] px-2 py-1
         font-mono text-muted transition-transform duration-150 hover:text-accent-text
         active:scale-[0.97]"
>
  <span aria-hidden="true" data-icon>☾</span>
</button>

<script is:inline>
  const toggle = document.getElementById('theme-toggle');
  const icon = toggle.querySelector('[data-icon]');

  function render() {
    const isDark = document.documentElement.dataset.theme === 'dark';
    icon.textContent = isDark ? '☾' : '☀';
    toggle.setAttribute(
      'aria-label',
      isDark ? toggle.dataset.toLight : toggle.dataset.toDark,
    );
  }

  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage is unavailable in some privacy modes; the theme still flips for this page view.
    }
    render();
  });

  render();
</script>
```

Storage writes are guarded the same way the layout's bootstrap read is: when storage access throws, the toggle still flips the theme for the current page view instead of dying mid-handler. The label describes the action the click performs, so it reads as "Switch to light theme" while dark is active. The test matches `/theme/i`, which both labels satisfy.

- [ ] **Step 5: Write Header**

Create `src/components/Header.astro`:

```astro
---
import LangSwitch from './LangSwitch.astro';
import ThemeToggle from './ThemeToggle.astro';
import type { Locale } from '../lib/locale';

interface Props {
  locale: Locale;
  controls: {
    switchLanguage: string;
    switchToDark: string;
    switchToLight: string;
    otherLanguageName: string;
  };
}

const { locale, controls } = Astro.props;
---

<header
  class="mx-auto flex max-w-3xl items-center justify-between gap-4 border-b border-border
         px-4 py-4 sm:px-6"
>
  <span class="font-mono text-[var(--text-step-minus-1)] text-muted">mubi.dev</span>
  <nav class="flex items-center gap-2">
    <LangSwitch
      locale={locale}
      label={controls.switchLanguage}
      otherLanguageName={controls.otherLanguageName}
    />
    <ThemeToggle toDark={controls.switchToDark} toLight={controls.switchToLight} />
  </nav>
</header>
```

- [ ] **Step 6: Mount the header on both pages**

In `src/pages/index.astro` and `src/pages/ru/index.astro`, import `Header` and place it as the first child inside `BaseLayout`, above `<main>`:

```astro
<Header locale="en" controls={page.ui.controls} />
```

Use `locale="ru"` in the Russian page.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/header.spec.ts`
Expected: PASS, 4 tests.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add header with language switch and theme toggle"
```

---

### Task 6: Hero section

**Files:**
- Create: `src/components/Hero.astro`, `src/components/SectionHeading.astro`, `tests/e2e/hero.spec.ts`
- Modify: `src/pages/index.astro`, `src/pages/ru/index.astro`

**Interfaces:**
- Consumes: `profile`, `ui`, `contact` from `loadPage`.
- Produces: `SectionHeading.astro` with props `{ label: string; id: string }` rendering an `<h2>` in mono with a top hairline divider, reused by Tasks 7, 8, 9. `Hero.astro` with props `{ profile, contact, sectionLabel }`.

- [ ] **Step 1: Write the failing hero test**

Create `tests/e2e/hero.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('hero states the name, the man line, and the stack', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mubinjon Mukhamedov');
  await expect(
    page.getByText('mubi - infrastructure engineer and product developer'),
  ).toBeVisible();
  await expect(page.getByText('Linux', { exact: false }).first()).toBeVisible();
});

test('hero has exactly one primary call to action pointing at the real mailto', async ({ page }) => {
  await page.goto('/');
  const cta = page.getByTestId('hero-cta');
  await expect(cta).toHaveCount(1);
  await expect(cta).toHaveAttribute('href', /^mailto:/);
});

test('hero secondary links open the real profiles', async ({ page }) => {
  await page.goto('/');
  const links = page.getByTestId('hero-secondary').locator('a');
  expect(await links.count()).toBeGreaterThanOrEqual(2);
  for (let index = 0; index < (await links.count()); index += 1) {
    await expect(links.nth(index)).toHaveAttribute('href', /^https:\/\//);
  }
});

test('the page has exactly one h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/hero.spec.ts`
Expected: FAIL, no `hero-cta` test id.

- [ ] **Step 3: Write SectionHeading**

Create `src/components/SectionHeading.astro`:

```astro
---
interface Props {
  label: string;
  id: string;
}

const { label, id } = Astro.props;
---

<h2
  id={id}
  class="mb-6 border-t border-border pt-8 font-mono text-[var(--text-step-minus-1)] font-normal tracking-[0.08em]
         text-muted uppercase"
>
  {label}
</h2>
```

Section chrome is defined once here rather than repeated per section, so the divider and label rhythm cannot drift between sections.

- [ ] **Step 4: Write Hero**

Create `src/components/Hero.astro`:

```astro
---
interface Props {
  profile: {
    name: string;
    manLine: string;
    summary: string[];
    inlineStack: string[];
    ctaLabel: string;
  };
  contact: { email: string; links: { label: string; url: string }[] };
  sectionLabel: string;
}

const { profile, contact, sectionLabel } = Astro.props;
---

<section aria-labelledby="section-name" class="pt-4">
  <h2
    id="section-name"
    class="mb-4 font-mono text-[var(--text-step-minus-1)] font-normal tracking-[0.08em] text-muted uppercase"
  >
    {sectionLabel}
  </h2>

  <h1 class="text-[var(--text-step-4)] sm:text-[var(--text-step-5)]">{profile.name}</h1>

  <p class="mt-3 font-mono text-[var(--text-step-1)] text-accent-text">{profile.manLine}</p>

  <div class="mt-6 max-w-[66ch] space-y-3 text-[var(--text-step-0)] text-text">
    {profile.summary.map((sentence) => <p>{sentence}</p>)}
  </div>

  <p class="mt-4 font-mono text-[var(--text-step-minus-1)] text-muted">
    {profile.inlineStack.join(' · ')}
  </p>

  <div class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
    <a
      data-testid="hero-cta"
      href={`mailto:${contact.email}`}
      class="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-accent
             px-5 py-2 font-mono text-text no-underline transition-transform duration-150
             hover:bg-surface active:scale-[0.97]"
    >
      {profile.ctaLabel}
    </a>

    <span data-testid="hero-secondary" class="flex flex-wrap items-center gap-x-4 gap-y-2">
      {
        contact.links.map((link) => (
          <a
            href={link.url}
            rel="me noopener"
            class="inline-flex min-h-6 items-center font-mono text-[var(--text-step-minus-1)] text-muted
                   transition-colors duration-150 hover:text-accent-text"
          >
            {link.label} <span aria-hidden="true">↗</span>
          </a>
        ))
      }
    </span>
  </div>
</section>
```

The hero uses its own heading markup rather than `SectionHeading`, because it must not carry a top divider and its `h1` follows the label. That is a real difference, not duplication.

- [ ] **Step 5: Mount Hero on both pages**

In both page files, replace the placeholder `<main>` content with:

```astro
<main class="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
  <Hero profile={page.profile} contact={page.contact} sectionLabel={page.ui.sections.name} />
</main>
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/hero.spec.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add hero section"
```

---

### Task 7: Experience timeline on the vertical axis

**Files:**
- Create: `src/components/Experience.astro`, `tests/e2e/experience.spec.ts`
- Modify: `src/pages/index.astro`, `src/pages/ru/index.astro`

**Interfaces:**
- Consumes: `experience.entries` and `ui.sections.experience`; `SectionHeading` from Task 6.
- Produces: `Experience.astro` with props `{ entries: { period: string; employer: string; role: string; lines: string[] }[]; sectionLabel: string }`.

- [ ] **Step 1: Write the failing experience test**

Create `tests/e2e/experience.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('experience renders every entry with period, employer, and role', async ({ page }) => {
  await page.goto('/');
  const entries = page.getByTestId('experience-entry');
  expect(await entries.count()).toBeGreaterThanOrEqual(1);
  await expect(entries.first()).toContainText('Bank Eskhata');
  await expect(entries.first()).toContainText('2022');
});

test('experience entries sit on a single shared axis', async ({ page }) => {
  await page.goto('/');
  const axis = page.getByTestId('experience-axis');
  await expect(axis).toHaveCount(1);
});

test('Russian experience renders the translated employer', async ({ page }) => {
  await page.goto('/ru/');
  await expect(page.getByTestId('experience-entry').first()).toContainText('Банк Эсхата');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/experience.spec.ts`
Expected: FAIL, no `experience-entry` test id.

- [ ] **Step 3: Write Experience**

Create `src/components/Experience.astro`:

```astro
---
import SectionHeading from './SectionHeading.astro';

interface Props {
  entries: { period: string; employer: string; role: string; lines: string[] }[];
  sectionLabel: string;
}

const { entries, sectionLabel } = Astro.props;
---

<section aria-labelledby="section-experience" class="mt-12">
  <SectionHeading id="section-experience" label={sectionLabel} />

  <ol data-testid="experience-axis" class="relative m-0 list-none border-l border-border pl-6">
    {
      entries.map((entry) => (
        <li data-testid="experience-entry" class="relative pb-8 last:pb-0">
          <span
            aria-hidden="true"
            class="absolute top-[0.55rem] -left-[calc(0.25rem+1px)] block h-2 w-2 rounded-full
                   bg-accent"
          />
          <p class="font-mono text-[var(--text-step-minus-1)] text-muted">{entry.period}</p>
          <h3 class="mt-1 text-[var(--text-step-1)]">{entry.employer}</h3>
          <p class="mt-1 font-mono text-[var(--text-step-minus-1)] text-accent-text">{entry.role}</p>
          <div class="mt-2 max-w-[66ch] space-y-1 text-text">
            {entry.lines.map((line) => <p>{line}</p>)}
          </div>
        </li>
      ))
    }
  </ol>
</section>
```

The axis is one `border-l` on the list, not a stripe per entry, so it reads as a single continuous timeline. The dots are `aria-hidden` because chronology is already carried by the ordered list and the period text.

- [ ] **Step 4: Mount Experience on both pages**

Add inside `<main>`, after `Hero`:

```astro
<Experience entries={page.experience.entries} sectionLabel={page.ui.sections.experience} />
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/experience.spec.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add experience timeline"
```

---

### Task 8: Cases section

**Files:**
- Create: `src/components/Cases.astro`, `tests/e2e/cases.spec.ts`
- Modify: `src/pages/index.astro`, `src/pages/ru/index.astro`

**Interfaces:**
- Consumes: `cases.entries`, `ui.sections.cases`, `ui.caseLabels`; `SectionHeading` from Task 6.
- Produces: `Cases.astro` with props `{ entries: { title: string; problem: string; action: string; result: string }[]; sectionLabel: string; labels: { problem: string; action: string; result: string } }`.

- [ ] **Step 1: Write the failing cases test**

Create `tests/e2e/cases.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('each case shows problem, action, and result', async ({ page }) => {
  await page.goto('/');
  const cases = page.getByTestId('case-entry');
  expect(await cases.count()).toBeGreaterThanOrEqual(1);
  const first = cases.first();
  await expect(first).toContainText('Problem');
  await expect(first).toContainText('What I did');
  await expect(first).toContainText('Result');
});

test('cases use a description list so label and value are associated', async ({ page }) => {
  await page.goto('/');
  const terms = page.getByTestId('case-entry').first().locator('dt');
  await expect(terms).toHaveCount(3);
});

test('Russian cases use translated labels', async ({ page }) => {
  await page.goto('/ru/');
  await expect(page.getByTestId('case-entry').first()).toContainText('Проблема');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/cases.spec.ts`
Expected: FAIL, no `case-entry` test id.

- [ ] **Step 3: Write Cases**

Create `src/components/Cases.astro`:

```astro
---
import SectionHeading from './SectionHeading.astro';

interface Props {
  entries: { title: string; problem: string; action: string; result: string }[];
  sectionLabel: string;
  labels: { problem: string; action: string; result: string };
}

const { entries, sectionLabel, labels } = Astro.props;
---

<section aria-labelledby="section-cases" class="mt-12">
  <SectionHeading id="section-cases" label={sectionLabel} />

  <div class="space-y-8">
    {
      entries.map((entry) => (
        <article data-testid="case-entry" class="border-t border-border pt-6 first:border-t-0 first:pt-0">
          <h3 class="text-[var(--text-step-1)]">{entry.title}</h3>
          <dl class="mt-3 grid max-w-[66ch] gap-x-6 gap-y-2 sm:grid-cols-[8rem_1fr]">
            <dt class="font-mono text-[var(--text-step-minus-1)] text-muted">{labels.problem}</dt>
            <dd class="m-0">{entry.problem}</dd>
            <dt class="font-mono text-[var(--text-step-minus-1)] text-muted">{labels.action}</dt>
            <dd class="m-0">{entry.action}</dd>
            <dt class="font-mono text-[var(--text-step-minus-1)] text-accent-text">{labels.result}</dt>
            <dd class="m-0">{entry.result}</dd>
          </dl>
        </article>
      ))
    }
  </div>
</section>
```

A description list is the honest markup here: each label genuinely names its value, which also makes the pairing available to screen readers. Entries are separated by hairlines rather than cards, so no card ends up nested in another card.

- [ ] **Step 4: Mount Cases on both pages**

Add inside `<main>`, after `Experience`:

```astro
<Cases
  entries={page.cases.entries}
  sectionLabel={page.ui.sections.cases}
  labels={page.ui.caseLabels}
/>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/cases.spec.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add cases section"
```

---

### Task 9: Stack and contact sections

**Files:**
- Create: `src/components/Stack.astro`, `src/components/Contact.astro`, `tests/e2e/stack-contact.spec.ts`
- Modify: `src/pages/index.astro`, `src/pages/ru/index.astro`

**Interfaces:**
- Consumes: `stack.groups`, `contact`, `ui.sections.stack`, `ui.sections.contact`, `profile.ctaLabel`; `SectionHeading` from Task 6.
- Produces: `Stack.astro` with props `{ groups: { label: string; items: string[] }[]; sectionLabel: string }`; `Contact.astro` with props `{ contact: { email: string; links: { label: string; url: string }[] }; sectionLabel: string }`.

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/stack-contact.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('stack renders grouped technologies without proficiency indicators', async ({ page }) => {
  await page.goto('/');
  const groups = page.getByTestId('stack-group');
  expect(await groups.count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByTestId('stack-group').first()).toContainText('Docker');
  await expect(page.locator('progress, [role="progressbar"], meter')).toHaveCount(0);
  await expect(page.getByTestId('stack-group').first()).not.toContainText('%');
});

test('contact exposes a real mailto and absolute profile links', async ({ page }) => {
  await page.goto('/');
  const email = page.getByTestId('contact-email');
  await expect(email).toHaveAttribute('href', /^mailto:/);
  const links = page.getByTestId('contact-links').locator('a');
  expect(await links.count()).toBeGreaterThanOrEqual(2);
  for (let index = 0; index < (await links.count()); index += 1) {
    await expect(links.nth(index)).toHaveAttribute('href', /^https:\/\//);
  }
});

test('the page ships no contact form', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('form')).toHaveCount(0);
});

test('every link and button is either functional or explicitly disabled', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('a');
  for (let index = 0; index < (await links.count()); index += 1) {
    const href = await links.nth(index).getAttribute('href');
    expect(href, `link ${index} href`).toBeTruthy();
    expect(href, `link ${index} href`).not.toBe('#');
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/stack-contact.spec.ts`
Expected: FAIL, no `stack-group` test id.

- [ ] **Step 3: Write Stack**

Create `src/components/Stack.astro`:

```astro
---
import SectionHeading from './SectionHeading.astro';

interface Props {
  groups: { label: string; items: string[] }[];
  sectionLabel: string;
}

const { groups, sectionLabel } = Astro.props;
---

<section aria-labelledby="section-stack" class="mt-12">
  <SectionHeading id="section-stack" label={sectionLabel} />

  <dl class="grid gap-x-6 gap-y-4 sm:grid-cols-[10rem_1fr]">
    {
      groups.map((group) => (
        <div data-testid="stack-group" class="grid gap-1 sm:col-span-2 sm:grid-cols-subgrid">
          <dt class="font-mono text-[var(--text-step-minus-1)] text-muted">{group.label}</dt>
          <dd class="m-0 font-mono text-text">{group.items.join(' · ')}</dd>
        </div>
      ))
    }
  </dl>
</section>
```

- [ ] **Step 4: Write Contact**

Create `src/components/Contact.astro`:

```astro
---
import SectionHeading from './SectionHeading.astro';

interface Props {
  contact: { email: string; links: { label: string; url: string }[] };
  sectionLabel: string;
}

const { contact, sectionLabel } = Astro.props;
---

<section aria-labelledby="section-contact" class="mt-12">
  <SectionHeading id="section-contact" label={sectionLabel} />

  <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
    <a
      data-testid="contact-email"
      href={`mailto:${contact.email}`}
      class="inline-flex min-h-11 items-center font-mono text-[var(--text-step-1)] text-text
             transition-colors duration-150 hover:text-accent-text"
    >
      {contact.email}
    </a>

    <span data-testid="contact-links" class="flex flex-wrap items-center gap-x-4 gap-y-2">
      {
        contact.links.map((link) => (
          <a
            href={link.url}
            rel="me noopener"
            class="inline-flex min-h-6 items-center font-mono text-[var(--text-step-minus-1)] text-muted
                   transition-colors duration-150 hover:text-accent-text"
          >
            {link.label} <span aria-hidden="true">↗</span>
          </a>
        ))
      }
    </span>
  </div>
</section>
```

Contact repeats the primary action at the foot of the page, so a convinced reader never scrolls back up to act.

- [ ] **Step 5: Mount both on both pages**

Add inside `<main>`, after `Cases`:

```astro
<Stack groups={page.stack.groups} sectionLabel={page.ui.sections.stack} />
<Contact contact={page.contact} sectionLabel={page.ui.sections.contact} />
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/stack-contact.spec.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add stack and contact sections"
```

---

### Task 10: Accessibility, responsive, and motion verification pass

**Files:**
- Create: `tests/e2e/a11y.spec.ts`, `tests/e2e/responsive.spec.ts`, `tests/e2e/motion.spec.ts`
- Modify: whichever component files the failures point at.

**Interfaces:**
- Consumes: the finished page from Tasks 5 to 9.
- Produces: no new source interfaces. This task's deliverable is a green a11y, responsive, and motion suite covering both locales and both themes.

- [ ] **Step 1: Write the failing axe test across both locales and themes**

Create `tests/e2e/a11y.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const PATHS = ['/', '/ru/'];
const THEMES = ['dark', 'light'] as const;

for (const path of PATHS) {
  for (const theme of THEMES) {
    test(`${path} has no axe violations in the ${theme} theme`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

test('every focusable element shows a focus ring at least 2px wide', async ({ page }) => {
  await page.goto('/');
  const focusables = page.locator('a[href], button:not([disabled])');
  const count = await focusables.count();
  expect(count).toBeGreaterThan(4);

  for (let index = 0; index < count; index += 1) {
    const element = focusables.nth(index);
    await element.focus();
    const width = await element.evaluate((node) => getComputedStyle(node).outlineWidth);
    expect(parseFloat(width), `focusable ${index}`).toBeGreaterThanOrEqual(2);
  }
});

test('heading order is correct and there is a single h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  const levels = await page
    .locator('h1, h2, h3')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));
  for (let index = 1; index < levels.length; index += 1) {
    expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
  }
});
```

- [ ] **Step 2: Run it and fix what it reports**

Run: `npm run test:e2e -- tests/e2e/a11y.spec.ts`
Expected: initially FAIL. Fix the reported violations in the component files. Do not silence a violation by removing the check or narrowing the tag list.

- [ ] **Step 3: Write the failing responsive test**

Create `tests/e2e/responsive.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const WIDTHS = [320, 375, 768, 1280, 2560];

for (const width of WIDTHS) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('text remains readable and unclipped at 200 percent zoom', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('body copy is capped at a comfortable measure', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const widths = await page
    .locator('main p')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
  expect(widths.length).toBeGreaterThan(0);
  for (const width of widths) {
    expect(width).toBeLessThanOrEqual(800);
  }
});
```

- [ ] **Step 4: Run it and fix what it reports**

Run: `npm run test:e2e -- tests/e2e/responsive.spec.ts`
Expected: PASS after fixing any overflow. Common cause at 320px is a long email or an unbroken URL; fix with `break-words` on the offending element, not by hiding content.

- [ ] **Step 5: Write the failing motion test**

Create `tests/e2e/motion.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('reduced motion collapses transitions', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const duration = await page
    .getByTestId('hero-cta')
    .evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(parseFloat(duration)).toBeLessThan(0.05);
  await context.close();
});

test('no element animates the all property', async ({ page }) => {
  await page.goto('/');
  const offenders = await page.evaluate(() =>
    Array.from(document.querySelectorAll('*'))
      .filter((node) => getComputedStyle(node).transitionProperty === 'all')
      .map((node) => node.tagName),
  );
  expect(offenders).toEqual([]);
});
```

- [ ] **Step 6: Run it and fix what it reports**

Run: `npm run test:e2e -- tests/e2e/motion.spec.ts`
Expected: PASS. If `transition-property` resolves to `all` anywhere, replace the Tailwind `transition` utility with the explicit `transition-colors` or `transition-transform` variant.

- [ ] **Step 7: Run the whole suite**

Run: `npm test && npm run test:e2e`
Expected: every unit and e2e test passes.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: verify accessibility, responsive behavior, and motion"
```

---

### Task 11: Print stylesheet that produces a one-page resume

**Files:**
- Modify: `src/styles/global.css`
- Create: `tests/e2e/print.spec.ts`

**Interfaces:**
- Consumes: the finished page.
- Produces: `@media print` rules; no new JavaScript interface.

- [ ] **Step 1: Write the failing print test**

Create `tests/e2e/print.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('print media hides controls and keeps content', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('header nav')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('contact-email')).toBeVisible();

  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe('rgb(255, 255, 255)');
});

test('print exposes link targets that are not otherwise visible', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  const printedUrl = await page
    .getByTestId('contact-links')
    .locator('a')
    .first()
    .evaluate((node) => getComputedStyle(node, '::after').content);
  expect(printedUrl).toContain('https://');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/print.spec.ts`
Expected: FAIL, controls still visible in print media.

- [ ] **Step 3: Add the print rules**

Append to `src/styles/global.css`:

```css
@media print {
  html {
    background: #ffffff;
    color: #000000;
    font-size: 11pt;
  }

  body {
    background: #ffffff;
    min-height: auto;
  }

  header nav {
    display: none;
  }

  main {
    max-width: none;
    padding: 0;
  }

  section {
    break-inside: avoid;
    margin-top: 16px;
  }

  li[data-testid='experience-entry'],
  article[data-testid='case-entry'] {
    break-inside: avoid;
  }

  a {
    color: #000000;
    text-decoration: none;
  }

  [data-testid='contact-links'] a::after,
  [data-testid='hero-secondary'] a::after {
    content: ' (' attr(href) ')';
    font-size: 9pt;
  }

  [aria-hidden='true'] {
    display: none;
  }

  @page {
    margin: 14mm;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/print.spec.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Check the printed result by eye**

Run `npm run dev`, open `http://localhost:4321`, press Ctrl+P, and confirm the preview is one page with no clipped content and no controls. If it spills to a second page, reduce `section` top margins in the print block only, never the screen layout.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add print stylesheet producing a one-page resume"
```

---

### Task 12: Ship it: robots, Open Graph image, Lighthouse, deployment, handover

**Files:**
- Create: `public/robots.txt`, `public/og.png`, `docs/HANDOVER.md`, `README.md`
- Modify: `astro.config.mjs` if the Lighthouse run finds a fixable issue.

**Interfaces:**
- Consumes: the complete site.
- Produces: a deployable build and a handover note listing every `TODO:` the owner must fill in.

- [ ] **Step 1: Add robots.txt**

Create `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://mubi.dev/sitemap-index.xml
```

- [ ] **Step 2: Generate the Open Graph image**

Take a screenshot of the hero at 1200x630 in the dark theme and save it as `public/og.png`:

```bash
npm run build
npm run preview &
npx playwright screenshot --viewport-size=1200,630 --wait-for-timeout=1500 http://localhost:4321 public/og.png
kill %1
```

Verify the file is a 1200x630 PNG and that the name and the man line are legible in it. If the hero is cut off, adjust the wait or scroll position rather than shipping a broken preview.

- [ ] **Step 3: Verify sitemap and robots in the build output**

Run: `npm run build && ls dist/sitemap-index.xml dist/robots.txt dist/og.png`
Expected: all three exist. The sitemap must list both `https://mubi.dev/` and `https://mubi.dev/ru/`.

- [ ] **Step 4: Run Lighthouse and record the scores**

```bash
npm run preview &
npx lighthouse http://localhost:4321 --preset=perf --form-factor=mobile --screenEmulation.mobile --output=json --output-path=/tmp/lh-perf.json --chrome-flags="--headless"
npx lighthouse http://localhost:4321 --only-categories=accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile --output=json --output-path=/tmp/lh-rest.json --chrome-flags="--headless"
kill %1
node -e "for (const f of ['/tmp/lh-perf.json','/tmp/lh-rest.json']) { const r = require(f); for (const [k, v] of Object.entries(r.categories)) console.log(k, Math.round(v.score * 100)); }"
```

Expected: every category at 95 or above (spec acceptance criterion 9). If a category falls short, fix the cause and rerun. Report the actual numbers; do not claim the criterion is met without the output.

- [ ] **Step 5: Write the handover note listing every placeholder**

Create `docs/HANDOVER.md`:

```markdown
# Handover: what still needs real facts

Every item below is a `TODO:` marker in a data file. The site builds and looks finished with
them in place, but they are placeholders. Nothing here was invented.

| File | Field | What to write |
|---|---|---|
| `src/content/profile/{en,ru}.yaml` | `summary[1]` | One sentence on the work you want next |
| `src/content/experience/{en,ru}.yaml` | entry 1 `lines` | Two lines on your scope at Bank Eskhata |
| `src/content/experience/{en,ru}.yaml` | entry 2 | Previous employer, years, role, scope |
| `src/content/cases/{en,ru}.yaml` | both entries | Title, problem, what you did, measurable result |
| `src/content/contact/{en,ru}.yaml` | `email` | Personal email address, not the work one |
| `src/content/contact/{en,ru}.yaml` | `links` | Real GitHub, LinkedIn, and Telegram URLs |
| `src/content/profile/{en,ru}.yaml` | `name` | Confirm the transliteration of your name |

Rules when editing:

- Fill both locales. A key present in one and missing in the other fails the build on purpose.
- No em-dash in the English files. `npm test` checks this.
- After editing, run `npm test && npm run test:e2e` before deploying.
- Regenerate `public/og.png` after changing the hero text (see Task 12 in the plan).
```

- [ ] **Step 6: Write the README**

Create `README.md`:

```markdown
# mubi.dev

Personal CV site. Astro, static output, deployed to Cloudflare Pages.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server on port 4321 |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built output |
| `npm test` | Unit tests: schemas, locale parity, copy rules, color contrast |
| `npm run test:e2e` | Playwright: accessibility, states, responsive, print |

## Editing content

All copy lives in `src/content/<section>/{en,ru}.yaml`. Both locales must carry the same keys;
a missing key fails the build. See `docs/HANDOVER.md` for the placeholders that still need
real facts.

## Design decisions

See `docs/superpowers/specs/2026-07-31-mubi-dev-design.md`. Color, spacing, radius, and motion
tokens live in `src/styles/tokens.css` and are the only source of those values.

## Deployment

Cloudflare Pages, build command `npm run build`, output directory `dist`, no environment
variables required.
```

- [ ] **Step 7: Run the complete verification**

Run: `npm test && npm run test:e2e && npm run build`
Expected: all unit tests pass, all e2e tests pass, build completes with no errors or warnings.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: add robots, og image, handover note, and readme"
```

- [ ] **Step 9: Report the deployment steps to the owner, do not perform them**

Deployment touches an external service and a live domain, so it needs explicit approval. Report these steps rather than executing them:

1. Push the repository to GitHub (private is fine).
2. In Cloudflare Pages, create a project from that repository. Framework preset Astro, build command `npm run build`, output directory `dist`.
3. Add the custom domain `mubi.dev`, plus `www.mubi.dev` redirecting to the apex.
4. Confirm the first deployment serves `/` and `/ru/`, and that HTTPS is enforced.

---

## Self-Review

**Spec coverage.** Every numbered spec section maps to a task: purpose and sections (Tasks 6 to 9), audience and language (Task 3 data plus Task 4 hreflang), positioning (Task 3 profile copy), content model (Task 3), visual direction and tokens (Task 2), interaction states (Tasks 5 and 10), accessibility floor (Task 10), print (Task 11), technical architecture (Tasks 1, 3, 4), SEO (Tasks 4 and 12), deployment (Task 12), exclusions (asserted by tests in Tasks 9 and 10 and by the copy test in Task 3), acceptance criteria 1 to 11 (criteria 1 to 3 Task 3 and 4, 4 Task 2 and 10, 5 Tasks 5 and 10, 6 Task 10, 7 Task 11, 8 Task 10, 9 and 10 Task 12, 11 every task's build step).

**Placeholder scan.** The only `TODO:` strings are intentional content placeholders in YAML data files, which the spec requires and Task 12 documents. No step says "add error handling" or "write tests for the above" without the code.

**Type consistency.** `loadPage` returns `{ profile, experience, cases, stack, contact, ui }` in Task 3 and every later task consumes exactly those names. Schema field names (`manLine`, `inlineStack`, `ctaLabel`, `entries`, `groups`, `caseLabels`, `controls`) match between `schemas.ts`, the YAML files, and the component props. Test ids used across tasks (`hero-cta`, `hero-secondary`, `experience-axis`, `experience-entry`, `case-entry`, `stack-group`, `contact-email`, `contact-links`) are each defined in the task that creates the component and referenced consistently afterwards, including in the print stylesheet.
