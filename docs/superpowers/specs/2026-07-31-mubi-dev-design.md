# mubi.dev design spec

Date: 2026-07-31
Status: approved, ready for implementation planning

## 1. Purpose

Personal business card / CV site for Mubinjon Mukhamedov at `mubi.dev`.

One job: a recruiter, tech lead, or prospective client opens the link (from an email or
LinkedIn), and within about 40 seconds knows who this person is, what level they work at,
what they have actually delivered, and how to reach them.

Explicit non-goals for this iteration: no blog, no project gallery beyond the case list, no
contact form, no analytics dashboard, no CMS.

## 2. Audience and language

Primary reader: international recruiters and tech leads, English-speaking.
Secondary reader: Russian-speaking colleagues, local and CIS clients.

- English is the default locale, served at `/`.
- Russian is a full translation, served at `/ru/`.
- Both locales are real translations. Copying one language into the other to satisfy a
  content-parity check is forbidden: it makes the site look finished while being fake.
- One language per locale. Brand names, technology names, and identifiers (Docker, HAProxy,
  FreeIPA, Go, Flutter) stay in their original form in both locales.
- `hreflang` link tags connect the two locales; a visible switch sits in the header.

## 3. Positioning

Headline positioning: infrastructure engineer **and** product developer.

The dual framing is deliberate and load-bearing: the day job is banking infrastructure
(networking, proxies, containers, identity), and the second half is building applications
(Flutter, Go, with prior Angular and .NET experience). The site must not read as "sysadmin
who also dabbles" or as "app developer who also has servers."

## 4. Sections

Ordered as they appear on the page. Each is a single component.

1. **Header**: wordmark `mubi.dev`, locale switch (EN / RU), theme toggle.
2. **Hero (`NAME`)**: full name, a one-line `man`-style summary, two supporting sentences,
   inline stack summary, primary CTA (`Get in touch`), quiet secondary links (GitHub,
   LinkedIn).
3. **Experience**: reverse-chronological timeline: period, employer, role, two or three
   lines on scope.
4. **Cases (`WHAT I FIXED`)**: two or three entries in `problem → what I did → result`
   form. This is the strongest section for the audience and the one that needs real facts.
5. **Stack**: grouped technologies (infrastructure / backend / apps). Grouped labels, no
   proficiency percentages or skill bars.
6. **Contact**: email, Telegram, GitHub, LinkedIn as real links. No form.

## 5. Content model

All copy lives in data files, separate from markup, so adding a job or a case means editing
one data file and never touching HTML.

```
src/content/en/{profile,experience,stack,cases,contact}
src/content/ru/{profile,experience,stack,cases,contact}
```

Both locales share an identical key structure, validated by Astro content collection
schemas, so a missing translation is a build error rather than a silent gap.

**Placeholders.** Real facts are not yet supplied. Unknown values ship as explicit `TODO:`
markers in the data files. No invented employers, dates, or metrics are written anywhere.
The site builds and renders with placeholders in place.

Facts still needed from the owner: full name transliteration for the heading, employment
history with years, two or three cases with concrete outcomes, personal email address,
GitHub handle, LinkedIn URL.

## 6. Visual direction

**Design read.** A business card for an infrastructure engineer, read by a recruiter in the
evening on a phone or laptop, in under a minute. Visual language: engineering restraint and
documentation density, no marketing decoration.

**Dials.** DESIGN_VARIANCE 5 (left-anchored axis, not centered symmetry) · MOTION_INTENSITY 3
(honest hover and press, one light entrance, then stillness) · VISUAL_DENSITY 6 (1px
dividers instead of card boxes).

**Signature.** The page opens in the shape of a `man` page `NAME` section:
`mubi - infrastructure engineer and product developer`. The same "name, hyphen, one-line
summary" format an engineer recognizes immediately and a recruiter reads as an ordinary
subtitle. Experience and cases hang off a single 1px vertical axis on the left; the axis
encodes chronology, it is not decoration.

**Anti-default guard.** Dark background plus one bright acid accent is a recognized
AI-default look, so the accent is amber rather than acid green or vermilion, and no fake
terminal, dashboard, or chat window is ever hand-built from `<div>` elements.

## 7. Design tokens

Single source of truth in `src/styles/tokens.css`, mapped into the Tailwind theme. No magic
numbers in components.

**Color, dark theme (default).**

| Role | Value | Reason |
|---|---|---|
| Base surface | `#101215` | Graphite, not pure black: black kills depth cues and fatigues the eye under light text |
| Elevated surface | lighter than base via white overlay (about 7 percent) | In dark themes depth comes from lightening, not from shadow |
| Text primary | 87 percent white | Pure white vibrates against dark surfaces |
| Text secondary | 60 percent white | |
| Text disabled | 38 percent white | |
| Border | 8 percent white hairline | |
| Accent | `#E0A340` amber | One accent, roughly 10 percent of the surface |

Light theme is required, not optional: part of the audience reads during the day, and the
print stylesheet derives from it.

**Spacing.** 4px scale only (4, 8, 12, 16, 24, 32, 48, 64). No arbitrary values.

**Typography.** Two families with distinct roles.

- Geist Mono: headings, section labels, years, stack values.
- IBM Plex Sans: body copy. Chosen for honest numerals and legibility, not decoration.
- Inter and JetBrains Mono are deliberately avoided as reflexive defaults.
- Modular scale, base 16px, ratio 1.25: 16 / 20 / 25 / 31 / 39 / 49px.
- Hero capped at 3.5rem. Headings tracking `-0.02em`, body tracking 0.
- Line height: body 1.5, headings 1.15. Text containers capped at 66ch.
- Two well-separated weights per family (400 / 700).

**Motion.** Named tokens: `--dur-short` 150ms (hover, press), `--dur-medium` 250ms
(transitions), exits about 30 percent shorter than entrances. Material 3 curves:
`--ease-enter cubic-bezier(0.05,0.7,0.1,1)`, `--ease-exit cubic-bezier(0.3,0,0.8,0.15)`.
Only `transform` and `opacity` are animated, never `transition: all`.
`prefers-reduced-motion: reduce` replaces movement with a near-instant opacity change.

**Radius.** `--radius-sm` 6px, `--radius-md` 10px. Nested radii stay concentric (child
radius never exceeds parent radius).

## 8. Interaction states

Every interactive element ships all six states as component variants, not one-off styles:
default, hover, pressed, focus-visible, disabled, and where applicable loading.

- Focus: visible 2px outline at 3:1 contrast minimum, via `:focus-visible`. Bare
  `outline: none` is a defect.
- Press: slight scale-down to about 0.97, springing back within 150ms.
- The quiet controls get the same treatment as the primary CTA: locale switch, theme toggle,
  every link in the contact row and in case entries. A control that looks touchable and does
  nothing reads as a screenshot rather than a site.
- Every control that looks actionable performs a real action. Nothing decorative-but-dead.

## 9. Accessibility floor

Non-negotiable, verified in both themes:

- Text contrast at least 4.5:1; large text and non-text UI (borders, icons, focus rings) at
  least 3:1.
- Interactive targets at least 24px on web, with transparent padding where the visual is
  smaller.
- Visible keyboard focus on everything focusable; full keyboard operability.
- Text scales to 200 percent without clipping or horizontal scroll (rem-based sizing).
- Reduced motion honored globally.
- Semantic landmarks, one `h1` per page, correct heading order, `lang` attribute per locale.

## 10. Print stylesheet

`@media print` turns the same page into a clean one-page resume: light surface, hidden
header controls and theme toggle, expanded link URLs, no page-break inside a timeline entry
or case entry.

Rationale: this removes the need for a separately maintained PDF and a "Download CV" button.
Ctrl+P produces the same content, always current.

## 11. Technical architecture

Astro with Tailwind, static output, zero client JavaScript except the theme toggle.

```
src/
  content/{en,ru}/       profile · experience · stack · cases · contact
  components/            Header · Hero · Experience · Cases · Stack · Contact
                         ThemeToggle · LangSwitch
  layouts/BaseLayout     head, SEO meta, Open Graph, hreflang, theme bootstrap
  styles/tokens.css      color · spacing · radius · motion tokens
  pages/index.astro      English
  pages/ru/index.astro   Russian
public/                  favicon, Open Graph image, fonts
```

One page per locale: a business card is scrolled, not navigated. Each component owns one
section and reads its copy from the content collection for the active locale.

Theme toggle: an inline script in `<head>` reads the stored preference and applies the class
before first paint, so there is no flash of the wrong theme. Default follows
`prefers-color-scheme`, with dark as the fallback when no preference is expressed.

Fonts are self-hosted with `font-display: swap` and preloaded, so no third-party request
blocks first render.

## 12. SEO and metadata

- Unique `<title>` and meta description per locale.
- Open Graph and Twitter card tags with a static preview image.
- `hreflang` pairs plus `x-default` pointing at the English page.
- `Person` JSON-LD structured data (name, job title, URL, social profiles).
- `sitemap.xml` and `robots.txt` generated at build time.

## 13. Deployment

- Host: Cloudflare Pages, deploying from the git repository.
- Domain `mubi.dev` is already registered; DNS points at the Pages project.
- Apex domain plus `www` redirecting to apex. HTTPS enforced.
- No server runtime, no secrets in the repository, no environment variables required for the
  build.

## 14. Explicit exclusions

Not built, on purpose:

- Fake product UI assembled from `<div>` elements (terminals, dashboards, chats).
- Em-dash characters in English copy. Russian copy uses a dash only where grammar requires
  it, never as a stylistic tic.
- Gradient text, glow gradients, glassmorphism, cards nested inside cards, rows of identical
  tiles, an eyebrow label above every section, numbered `01 / 02 / 03` section markers.
- Skill bars or proficiency percentages.
- A contact form. The site is static, so a form would either be non-functional or depend on a
  third-party service; real `mailto` and Telegram links are honest and work today.
- Buzzword copy. Every claim names something concrete that was built or fixed.

## 15. Acceptance criteria

The work is done when all of the following hold:

1. `/` renders in English and `/ru/` in Russian, with matching content structure and working
   locale switch in both directions.
2. All six sections render from data files; changing a data file changes the page with no
   markup edits.
3. A missing key in one locale fails the build rather than rendering an empty section.
4. Dark and light themes both pass the contrast floor in section 9, verified per text and
   non-text element.
5. Every interactive element has visible hover, press, and `:focus-visible` states, and is
   reachable and operable by keyboard alone.
6. `prefers-reduced-motion: reduce` removes all non-essential motion.
7. Ctrl+P produces a one-page resume with no clipped content and no controls printed.
8. Layout holds from 320px to 2560px width with no horizontal scroll and no clipped text;
   long names ellipsize cleanly.
9. Lighthouse: performance, accessibility, best practices, and SEO all at 95 or above on
   mobile emulation.
10. No placeholder text remains except intentional `TODO:` markers in data files, and every
    such marker is listed in the handover note so the owner knows exactly what to fill in.
11. `astro build` completes with no errors or warnings.
