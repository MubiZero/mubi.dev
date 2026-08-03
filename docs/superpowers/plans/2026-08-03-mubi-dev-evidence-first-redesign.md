# mubi.dev Evidence-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the decorative modular portfolio with a bilingual evidence-first engineering portfolio that renders reliably and leads recruiters and engineering leads to contact.

**Architecture:** Keep Astro static output and the existing content-collection boundary. Extend the bilingual YAML model with explicit proof copy, replace the workspace/about composition with focused semantic sections, and rebuild the shared CSS around an editorial layout while preserving theme, SEO, print, and progressive enhancement.

**Tech Stack:** Astro 7, TypeScript, YAML content collections with Zod, Tailwind CSS 4 plus shared CSS tokens, Astro Icon, Vitest, Playwright, axe-core.

## Global Constraints

- Keep Astro static output, sitemap, SEO/JSON-LD, Docker/nginx, RU/EN parity, and a one-page light print CV.
- Do not add dependencies unless existing Astro, CSS, and icon packages cannot meet a verified requirement.
- Do not invent employers, clients, projects, scale, metrics, testimonials, certifications, or technology usage.
- Public strings remain in content collections; RU and EN must express the same facts with genuine translations.
- Core content, case summaries, contact links, and anchor navigation work without JavaScript.
- JavaScript remains limited to theme persistence and current-section enhancement.
- Use neutral near-white and graphite surfaces, one tomato-red brand accent, and green only for real success semantics.
- Interactive targets aim for at least 44 by 44 CSS pixels and never fall below 24 by 24 CSS pixels.
- Text contrast is at least 4.5:1; non-text UI and focus indicators are at least 3:1.
- Support 320 through 2560 CSS pixels without horizontal page overflow and 200 percent text scaling without clipping.
- Routine motion uses the existing 140 to 260 millisecond tokens, animates transform or opacity, and respects `prefers-reduced-motion`.
- Publishing and deployment are outside this plan.

---

### Task 1: Refresh generated content state and lock the runtime contract

**Files:**
- Modify: `tests/unit/schemas.test.ts`
- Modify: `tests/unit/contrast.test.ts`
- Modify: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: the existing correct glob loader, bilingual YAML, and generated Astro content cache.
- Produces: a clean Astro content cache, passing token-contract tests, and proof that both routes render defined localized UI data.

- [ ] **Step 1: Add failing route-render tests**

Extend `tests/e2e/smoke.spec.ts` with a test for each route:

```ts
for (const path of ['/', '/ru/']) {
  test(`${path} renders localized UI content`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main-content');
  });
}
```

- [ ] **Step 2: Run the route tests and verify the current failure**

Run: `npx playwright test tests/e2e/smoke.spec.ts`

Expected against the currently running stale dev server: FAIL because the route returns 500 and `page.ui` is undefined. Record that `npm run build` succeeds, which proves the tracked loader and YAML are not the root cause.

- [ ] **Step 3: Refresh only generated Astro state**

Stop the stale development server, remove only the gitignored `.astro/` generated cache, and let Playwright rebuild the site. Do not change the glob loader or weaken `src/lib/content.ts`; the production build already proves both are correct.

- [ ] **Step 4: Bring unit fixtures up to the real UI and token schemas**

In `tests/unit/schemas.test.ts`, make the `uiSchema` valid fixture include `navigation`, `about`, `workspace`, `capabilities`, and `labels`, using short valid values and exactly three capability items. Keep the two negative assertions. In `tests/unit/contrast.test.ts`, parse the actual light selector `:root,\n[data-theme='light']`, the actual dark selector `[data-theme='dark']`, and the existing `--accent-strong` token instead of non-existent selector/token names.

- [ ] **Step 5: Verify the runtime contract**

Run: `npm test`

Run: `npx playwright test tests/e2e/smoke.spec.ts`

Expected: both commands PASS and both localized routes return HTTP 200.

- [ ] **Step 6: Commit the runtime fix**

```bash
git add tests/unit/schemas.test.ts tests/unit/contrast.test.ts tests/e2e/smoke.spec.ts
git commit -m "test: lock localized rendering contracts"
```

### Task 2: Add verified evidence content

**Files:**
- Modify: `src/content/schemas.ts`
- Modify: `src/content/ui/en.yaml`
- Modify: `src/content/ui/ru.yaml`
- Modify: `src/content/profile/en.yaml`
- Modify: `src/content/profile/ru.yaml`
- Test: `tests/unit/schemas.test.ts`
- Test: `tests/unit/parity.test.ts`
- Test: `tests/unit/copy.test.ts`

**Interfaces:**
- Consumes: existing verified facts in case and experience YAML.
- Produces: `profile.proof` as exactly three `{ value: string; label: string }` entries and localized outcome-led hero/contact labels.

- [ ] **Step 1: Add a failing profile proof schema test**

Add to the `profileSchema` fixture and assertions:

```ts
proof: [
  { value: '30 min', label: 'server provisioning' },
  { value: '50+', label: 'branches monitored' },
  { value: '1 min', label: 'first incident response' },
],
```

Add a negative test that a two-item `proof` array is rejected.

- [ ] **Step 2: Run the profile schema test and verify RED**

Run: `npm test -- tests/unit/schemas.test.ts`

Expected: FAIL because `profileSchema` does not accept or require `proof`.

- [ ] **Step 3: Extend the profile schema and bilingual content**

Add this contract to `profileSchema`:

```ts
proof: z.array(z.object({ value: nonEmpty, label: nonEmpty })).length(3),
```

Populate RU and EN with only facts already present in cases: provisioning reduced to about 30 minutes, monitoring for more than 50 branches, and first response reduced to about one minute. Rewrite hero and contact CTA copy as natural outcome-led text in each locale. Retain the existing `workspace` UI keys until Task 3 removes their final consumer.

- [ ] **Step 4: Verify schema, translation parity, and copy rules**

Run: `npm test`

Expected: PASS with identical RU/EN structure and no fake translation or banned English punctuation.

- [ ] **Step 5: Commit the evidence model**

```bash
git add src/content/schemas.ts src/content/profile/en.yaml src/content/profile/ru.yaml src/content/ui/en.yaml src/content/ui/ru.yaml tests/unit/schemas.test.ts
git commit -m "feat: add verified portfolio evidence"
```

### Task 3: Recompose the page around evidence and selected work

**Files:**
- Create: `src/components/Proof.astro`
- Modify: `src/components/Hero.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/components/Cases.astro`
- Modify: `src/components/Capabilities.astro`
- Modify: `src/components/Stack.astro`
- Modify: `src/components/Contact.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/ru/index.astro`
- Modify: `src/content/schemas.ts`
- Modify: `src/content/ui/en.yaml`
- Modify: `src/content/ui/ru.yaml`
- Delete: `src/components/Workspace.astro`
- Modify: `tests/e2e/hero.spec.ts`
- Modify: `tests/e2e/cases.spec.ts`
- Modify: `tests/e2e/stack-contact.spec.ts`
- Modify: `tests/e2e/header.spec.ts`

**Interfaces:**
- Consumes: `profile.proof`, case entries, capability entries, grouped stack entries, and existing contact data.
- Produces: semantic page order `Hero -> Proof -> Cases -> Capabilities -> Experience/Education -> Toolkit -> Contact` with stable IDs used by header anchors.

- [ ] **Step 1: Write failing evidence-first browser assertions**

Update focused E2E tests to assert:

```ts
await expect(page.getByTestId('proof-item')).toHaveCount(3);
await expect(page.locator('main > section').nth(1)).toHaveAttribute('id', 'proof');
await expect(page.locator('main > section').nth(2)).toHaveAttribute('id', 'work');
await expect(page.locator('.workspace-module')).toHaveCount(0);
await expect(page.getByTestId('stack-group')).toHaveCount(4);
await expect(page.getByTestId('hero-secondary').locator('a')).toHaveCount(3);
```

Keep existing assertions for a single `h1`, mailto CTA, native case semantics, absolute social URLs, theme persistence, and functional links.

- [ ] **Step 2: Run focused E2E tests and verify RED**

Run: `npx playwright test tests/e2e/hero.spec.ts tests/e2e/cases.spec.ts tests/e2e/stack-contact.spec.ts tests/e2e/header.spec.ts`

Expected: FAIL because proof, the new order, grouped toolkit, and hero-secondary hook do not exist.

- [ ] **Step 3: Build the semantic component structure**

Create `Proof.astro` with an `id="proof"`, a localized accessible heading, and a three-item list using `data-testid="proof-item"`. Update `Hero.astro` to expose `data-testid="hero-secondary"`, keep a single email CTA, and remove workspace-related presentation. Recompose both page files in the exact produced order, delete `Workspace.astro`, and remove the now-unused `workspace` object from the UI schema and both localized UI files.

- [ ] **Step 4: Make work and capabilities evidence-led**

Keep each case title and result permanently visible and use native `<details>` for problem and action. Make every case a wide article rather than an equal card. Present capabilities as a numbered or ruled responsibility list without generic icon cards. Do not add new visible copy outside YAML.

- [ ] **Step 5: Make toolkit and contact explicit**

Render each stack group as its own `data-testid="stack-group"` with a visible localized group label and technology list. Keep the email link primary in Contact, social profiles secondary, and no contact form.

- [ ] **Step 6: Simplify responsive navigation behavior**

Use one semantic navigation source. Desktop shows all approved anchors; mobile keeps the essential Home, Work, Experience, and Contact paths in the header rather than a persistent five-item bottom bar. Preserve language/theme controls and current-section enhancement.

- [ ] **Step 7: Verify component behavior**

Run: `npx playwright test tests/e2e/hero.spec.ts tests/e2e/cases.spec.ts tests/e2e/stack-contact.spec.ts tests/e2e/header.spec.ts`

Expected: PASS.

- [ ] **Step 8: Commit the evidence-first composition**

```bash
git add src/components src/pages tests/e2e/hero.spec.ts tests/e2e/cases.spec.ts tests/e2e/stack-contact.spec.ts tests/e2e/header.spec.ts
git commit -m "feat: recompose portfolio around evidence"
```

### Task 4: Implement the editorial visual system and complete QA

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `tests/e2e/responsive.spec.ts`
- Modify: `tests/e2e/a11y.spec.ts`
- Modify: `tests/e2e/motion.spec.ts`
- Modify: `tests/e2e/print.spec.ts`
- Create: `docs/superpowers/audits/2026-08-03-mubi-dev-evidence-first-design-qa.md`

**Interfaces:**
- Consumes: semantic class names and page order from Task 3.
- Produces: responsive light/dark editorial rendering, visible interaction states, reduced motion, and one-page print output.

- [ ] **Step 1: Add failing responsive and sticky-focus assertions**

Extend E2E coverage so every tested viewport has zero horizontal overflow, 200 percent text scaling has no overflow, all header controls are at least 44 pixels in both dimensions, and focusing the last link cannot leave it obscured by sticky UI:

```ts
const obscured = await page.getByTestId('contact-email').evaluate((node) => {
  const rect = node.getBoundingClientRect();
  return rect.top < 0 || rect.bottom > window.innerHeight;
});
expect(obscured).toBe(false);
```

- [ ] **Step 2: Run responsive and accessibility tests and verify RED**

Run: `npx playwright test tests/e2e/responsive.spec.ts tests/e2e/a11y.spec.ts tests/e2e/motion.spec.ts tests/e2e/print.spec.ts`

Expected: at least the new layout, 44-pixel header target, or focus visibility assertion FAILS before the new CSS.

- [ ] **Step 3: Rebuild layout foundations**

Use one page container, open hero composition, a proof rail, wide case rows, ruled capability list, compact chronology, grouped toolkit, and decisive contact block. Remove styles for workspace tiles, repeated module labels, the persistent mobile bottom navigation, and generic equal-card grids. Keep surfaces neutral and reserve borders or shadows for one clear edge treatment per element.

- [ ] **Step 4: Complete responsive, theme, state, and motion styling**

Use content-driven breakpoints, a single-column mobile flow, comfortable 45 to 75 character text measure, 44-pixel control targets, visible two-pixel focus, hover gated by hover capability, 140 to 260 millisecond transitions, and reduced-motion fallbacks. Ensure dark mode uses lighter graphite surfaces for elevation instead of heavy shadows.

- [ ] **Step 5: Preserve the print CV**

Keep print light, one page, and content-first. Hide navigation, social chrome, proof duplication, disclosure controls, decorative surfaces, and non-essential UI while showing condensed print experience and readable contacts.

- [ ] **Step 6: Run all automated gates**

Run in order:

```bash
npm test
npm run test:e2e
npm run build
```

Expected: all commands PASS with no warnings or browser console errors.

- [ ] **Step 7: Capture and inspect final visual evidence**

Capture RU and EN at 1440 by 1024 and 390 by 844 in both themes, plus the 320-pixel viewport and print. Inspect saved screenshots and compare them with `docs/design-references/mubi-dev-redesign-target.png`. Record at least first-viewport hierarchy, copy, case prominence, typography, palette, spacing, responsive behavior, focus visibility, and sticky-navigation behavior in the QA document. Fix every material issue before proceeding.

- [ ] **Step 8: Commit visual polish and QA evidence**

```bash
git add src/styles tests/e2e docs/superpowers/audits/2026-08-03-mubi-dev-evidence-first-design-qa.md
git commit -m "feat: apply editorial portfolio visual system"
```
