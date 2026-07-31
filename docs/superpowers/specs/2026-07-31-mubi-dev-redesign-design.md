# mubi.dev visual redesign specification

Date: 2026-07-31
Status: approved for implementation
Visual target: `docs/design-references/mubi-dev-redesign-target.png`
External reference: `https://www.marco.fyi/`

## 1. Outcome

Redesign `mubi.dev` from a narrow terminal-like CV into a memorable personal web business card.
The page must answer four questions within one screen: who Mubinjon is, what he does, what kind of
work he is trusted with, and how to contact him. Detailed experience and cases remain available but
support the identity instead of dominating it.

## 2. Audience and conversion

- Primary: international recruiters and engineering leads.
- Secondary: Russian-speaking clients and colleagues.
- Primary action: email Mubinjon.
- Secondary actions: inspect work, open GitHub or LinkedIn, switch language or theme.

## 3. Design direction

The approved direction combines a conventional global personal-portfolio structure with the visual
character of `marco.fyi`.

- Structure: familiar hero, about, expertise, selected work, experience, education, stack, contact.
- Character: white canvas, pale-gray modules, irregular but calm grid, floating segmented navigation,
  small red status markers, tactile controls, and varied module sizes.
- Ratio: approximately 55 percent conventional portfolio structure and 45 percent modular personal
  workspace.
- Cases occupy no more than one quarter of the page and appear after identity and expertise.
- No invented employers, projects, technologies, locations, metrics, handles, or testimonials.

Design dials:

- DESIGN_VARIANCE: 7/10. Asymmetric modular composition with a clear reading order.
- MOTION_INTENSITY: 5/10. Sliding nav indicator, gentle module reveals, tactile hover and press states.
- VISUAL_DENSITY: 4/10. Spacious and readable; modules group meaning rather than fill the canvas.

## 4. Page structure

1. Floating navigation: Home, About, Expertise, Work, Experience, Contact, language, theme.
2. Hero module: name, role, one sentence, contact CTA, GitHub, LinkedIn, Telegram.
3. Workspace module: real technology objects grouped into infrastructure, automation, observability,
   and product development. It is interactive but not a fake dashboard.
4. About module: concise human introduction derived from the existing profile copy.
5. Capabilities module: Infrastructure, Automation, Product Development.
6. Selected work: the two existing cases, shortened to title, context, action, and one outcome. Full
   detail remains accessible within each article without repeating metrics elsewhere.
7. Journey: compact experience timeline plus education.
8. Stack rail: all existing technologies, grouped and horizontally scrollable on narrow screens.
9. Contact module: email and real social links.

On mobile every module becomes a single column. Navigation becomes a fixed bottom bar with the
language and theme controls kept discoverable in the page header.

## 5. Visual system

- Canvas: neutral near-white in light mode and graphite in dark mode.
- Modules: cool pale gray in light mode; lighter graphite than the canvas in dark mode.
- Text: near-black / 87 percent white. Secondary text remains above WCAG AA contrast.
- Accent: tomato red for active navigation, markers, and primary action; green only for real
  operational-success semantics.
- Font: one open-source contemporary grotesk with broad Latin and Cyrillic support. Use Manrope for
  the first implementation; system fallbacks remain available.
- Radius: 28 to 32px for modules, pill radius for navigation and compact controls, 12 to 16px for
  inner tactile objects.
- Shadow: only on floating/tactile controls. Modules use surface contrast and thin borders.
- Icons: Phosphor for interface actions and Simple Icons for technologies. No handmade SVGs or emoji.

## 6. Motion and interaction

- Navigation links scroll to real sections and update an active indicator.
- Technology objects have hover, focus, and pressed feedback; they reveal a short category label.
- Theme selection is stored. When no preference is stored, follow `prefers-color-scheme`.
- All motion uses transform and opacity, starts feedback within 100ms, and respects
  `prefers-reduced-motion`.
- Keyboard focus is visible on every link and button.

## 7. Content and architecture

- Keep Astro static output, content collections, EN/RU parity, SEO, JSON-LD, sitemap, Docker/nginx,
  and print-CV behavior.
- Keep copy in YAML. Extend `ui` content only for navigation, capability labels, and accessible
  interaction labels.
- Components remain separated by responsibility: shell/navigation, hero/workspace, about,
  capabilities, selected work, journey, stack, contact.
- No client framework is added. Small inline scripts own theme and active-section behavior.

## 8. Responsive and accessibility requirements

- No horizontal page scroll from 320px to 2560px.
- Touch targets are at least 44px where space allows and never below WCAG 24px minimum.
- Text contrast is at least 4.5:1; controls and focus indicators at least 3:1.
- Text scales to 200 percent without clipped content or inaccessible controls.
- A skip link is the first focusable element.
- One `h1`, ordered headings, semantic sections, lists, landmarks, and descriptive links.
- Mobile fixed navigation must not obscure content or the contact action.

## 9. Print

Print remains a one-page light CV. Navigation, workspace decoration, capability chrome, module
backgrounds, and non-essential controls are removed. Experience uses the existing condensed print
entries; contact links remain readable.

## 10. Verification and deployment

- Required gates: `npm test`, `npm run test:e2e`, `npm run build`.
- Browser proof: desktop 1440x1024 and mobile 390x844, both locales, light/dark, navigation,
  theme persistence, keyboard focus, console health, and print.
- Visual QA compares the approved target and rendered screenshots in a combined image, fixes every
  P0/P1/P2 mismatch, and records `final result: passed` in `design-qa.md`.
- Push only scoped files to `main` after fresh verification.
- Deployment is complete only after the production URL serves the new release identity and visible
  redesign; a successful push alone is not deployment proof.
