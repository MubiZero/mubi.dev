# mubi.dev Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the terminal-like CV layout with the approved modular personal business card while preserving real bilingual content, accessibility, print, SEO, and deployment architecture.

**Architecture:** Astro continues to render two static locale routes from shared YAML content. New focused components compose a responsive modular grid; CSS tokens own the visual system and small inline scripts own theme and active-section navigation. Existing content schemas remain the source of truth and are extended only for UI labels.

**Tech Stack:** Astro 7, Tailwind CSS 4, Astro Content Collections, Manrope, Astro Icon with Phosphor and Simple Icons, Vitest, Playwright, axe-core, Docker/nginx.

## Global Constraints

- Use only facts already present in `src/content`; never invent production-facing claims.
- English remains `/`; Russian remains `/ru/`; structures must stay identical.
- Light and dark themes must pass text contrast 4.5:1 and non-text contrast 3:1.
- Interactive targets must be at least 24 CSS px, with 44px used for primary and mobile controls.
- Every interactive element needs default, hover, focus-visible, pressed, and disabled/loading states where applicable.
- Motion uses transform and opacity, respects reduced motion, and never uses `transition: all`.
- Preserve semantic landmarks, one `h1`, heading order, skip link, keyboard access, SEO, JSON-LD, hreflang, sitemap, and one-page print CV.
- No fake terminal, dashboard, stock photo, invented case, skill bars, gradient text, glassmorphism, nested cards, handmade SVG, emoji icon, or decorative technology not present in content.
- No horizontal page overflow from 320px to 2560px.

---

### Task 1: Lock visual contracts in tests

**Files:**
- Modify: `tests/e2e/header.spec.ts`
- Modify: `tests/e2e/hero.spec.ts`
- Modify: `tests/e2e/responsive.spec.ts`
- Modify: `tests/e2e/a11y.spec.ts`
- Create: `tests/e2e/redesign.spec.ts`

**Interfaces:**
- Consumes: routes `/` and `/ru/`, existing Playwright server configuration.
- Produces: DOM and interaction contracts for `#about`, `#expertise`, `#work`, `#experience`, `#contact`, floating desktop navigation, mobile bottom navigation, workspace tool buttons, and skip link.

- [ ] Write tests asserting the new section order and one `h1` containing the locale name.
- [ ] Write tests asserting desktop navigation is floating and mobile navigation is fixed at the bottom without covering the contact section.
- [ ] Write tests asserting every nav link scrolls to its section and updates `aria-current`.
- [ ] Write tests asserting skip-link focus, visible focus styles, and reduced-motion behavior.
- [ ] Run `npm run test:e2e -- tests/e2e/redesign.spec.ts tests/e2e/header.spec.ts tests/e2e/hero.spec.ts tests/e2e/responsive.spec.ts tests/e2e/a11y.spec.ts` and confirm failures are caused by missing redesign structure.

### Task 2: Add the shared visual system and icon dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `tests/unit/contrast.test.ts`

**Interfaces:**
- Consumes: existing theme bootstrap and contrast parser.
- Produces: CSS variables for canvas, module, elevated control, primary/secondary text, border, accent, success, focus, radii, shadows, container widths, and motion; Manrope font; global module and control primitives.

- [ ] Extend the contrast test with every foreground/background pair used by modules, navigation, CTA, and focus rings.
- [ ] Run `npm test -- tests/unit/contrast.test.ts` and confirm it fails because the new tokens do not exist.
- [ ] Install `@fontsource-variable/manrope`, `astro-icon`, `@iconify-json/ph`, and `@iconify-json/simple-icons`.
- [ ] Replace the palette and typography tokens with the approved light/dark system and map them through Tailwind.
- [ ] Add global skip-link, module, pill, focus, reduced-motion, and print primitives.
- [ ] Make the theme bootstrap follow stored preference first, then `prefers-color-scheme`.
- [ ] Run `npm test -- tests/unit/contrast.test.ts` and `npm run build`.

### Task 3: Build shell, navigation, hero, and workspace

**Files:**
- Modify: `src/content/schemas.ts`
- Modify: `src/content/ui/en.yaml`
- Modify: `src/content/ui/ru.yaml`
- Modify: `src/components/Header.astro`
- Modify: `src/components/Hero.astro`
- Modify: `src/components/LangSwitch.astro`
- Modify: `src/components/ThemeToggle.astro`
- Create: `src/components/Workspace.astro`
- Create: `src/components/Icon.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/ru/index.astro`

**Interfaces:**
- Consumes: `Locale`, profile/contact/stack data, extended UI labels.
- Produces: `Header` with real anchors and active state, `Hero` identity module, `Workspace` technology controls, reusable `Icon` wrapper, `#home` and `#about` anchors.

- [ ] Extend EN/RU UI content and schemas with navigation, capabilities, workspace, and accessible control labels; run parity/schema tests.
- [ ] Implement the skip link and responsive shell in both locale pages.
- [ ] Implement floating desktop navigation and mobile bottom navigation from one semantic link list.
- [ ] Implement hero and workspace modules using real contact links and technology names only.
- [ ] Add active-section behavior via `IntersectionObserver`, with no scroll listeners and a reduced-motion-safe fallback.
- [ ] Run the Task 1 header/hero/navigation tests until green.

### Task 4: Build supporting content modules

**Files:**
- Create: `src/components/About.astro`
- Create: `src/components/Capabilities.astro`
- Modify: `src/components/Cases.astro`
- Modify: `src/components/Experience.astro`
- Modify: `src/components/Education.astro`
- Modify: `src/components/Stack.astro`
- Modify: `src/components/Contact.astro`
- Remove: `src/components/SectionHeading.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/ru/index.astro`

**Interfaces:**
- Consumes: existing profile, cases, experience, education, stack, contact plus localized UI labels.
- Produces: `#about`, `#expertise`, `#work`, `#experience`, and `#contact` modules with stable test IDs and print hooks.

- [ ] Implement About from existing summary without creating new biographical claims.
- [ ] Implement three capability rows from existing stack groups and case responsibilities.
- [ ] Compress each case visually while retaining problem, action, and result text in semantic markup.
- [ ] Combine experience and education into the Journey composition while preserving print entries.
- [ ] Implement the scrollable stack rail and full-width contact ending.
- [ ] Run unit parity/copy/schema tests and relevant E2E section tests until green.

### Task 5: Responsive, interaction, and print completion

**Files:**
- Modify: `src/styles/global.css`
- Modify: `tests/e2e/theme.spec.ts`
- Modify: `tests/e2e/motion.spec.ts`
- Modify: `tests/e2e/print.spec.ts`
- Modify: `tests/e2e/stack-contact.spec.ts`

**Interfaces:**
- Consumes: completed components and token system.
- Produces: single-column mobile layout, fixed bottom navigation, light/dark persistence, reduced-motion behavior, and one-page A4 output.

- [ ] Add mobile layout assertions at 390x844 and narrow-width overflow checks at 320px.
- [ ] Add theme tests for system default, stored preference, icon/label state, and reload persistence.
- [ ] Add print assertions that workspace/navigation chrome is hidden and condensed experience is visible.
- [ ] Implement responsive and print CSS until all focused tests pass.
- [ ] Run `npm run test:e2e` and fix only root causes, not expectations that still express required behavior.

### Task 6: Visual QA, verification, publication, and deployment proof

**Files:**
- Create: `design-qa.md`
- Modify: `README.md`
- Modify: `docs/HANDOVER.md`

**Interfaces:**
- Consumes: approved target `docs/design-references/mubi-dev-redesign-target.png`, local rendered routes, git remote, Coolify deployment state.
- Produces: passing design QA, verified release commit, pushed `origin/main`, and production evidence.

- [ ] Capture `/` and `/ru/` at 1440x1024 and 390x844 in light and dark modes with Playwright; record console warnings/errors and primary interaction results.
- [ ] Combine the approved target and rendered desktop screenshot into one comparison image; inspect it and record fonts, spacing, colors, icons/assets, copy, and responsive differences.
- [ ] Fix every P0/P1/P2 mismatch, recapture, and repeat until `design-qa.md` says exactly `final result: passed`.
- [ ] Run fresh full gates: `npm test`, `npm run test:e2e`, and `npm run build`.
- [ ] Update README/HANDOVER with the new section model and maintenance instructions.
- [ ] Stage only scoped files, review `git diff --cached`, commit without AI attribution, and push `main`.
- [ ] Verify `origin/main` equals local HEAD.
- [ ] Inspect the Coolify deployment record/configured branch/SHA and wait for the webhook deployment rather than starting a duplicate deployment.
- [ ] Prove production by checking `https://mubi.dev/` and `https://mubi.dev/ru/` for the new release identity, visible redesign markers, working assets, and HTTP success.
