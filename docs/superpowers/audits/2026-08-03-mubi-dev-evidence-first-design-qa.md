# mubi.dev evidence-first design QA

Date: 2026-08-03

Status: final whole-branch review fix wave passed

Reference: `docs/design-references/mubi-dev-redesign-target.png` (923 × 1704)

Implementation evidence: Playwright Chromium screenshots in
`/tmp/mubi-dev-evidence-first-qa.u5uGtP/`; reviewer-fix evidence in
`/tmp/mubi-dev-evidence-first-fix1.26iNeN/`; final review evidence in
`/tmp/mubi-dev-final-qa.8RCaQA/`

## Method

The Browser/IAB plugin was not available, so the approved fallback was Playwright Chromium against
the production build served by `astro preview`. The accepted reference and the latest desktop,
mobile, dark-theme, expanded-case, and print renders were inspected with `view_image`.

The prior target is a continuity reference rather than a literal content or container template. The
implementation preserves its neutral white/graphite canvas, tomato accent, Manrope typography,
compact pill controls, and calm motion. It intentionally replaces the target's repeated bento and
dashboard modules with the approved evidence-first editorial structure.

## Evidence matrix

| Locale | Theme | 1440 × 1024 | 390 × 844 |
| --- | --- | --- | --- |
| EN | Light | `en-desktop-light.png` | `en-mobile-light.png` |
| EN | Dark | `en-desktop-dark.png` | `en-mobile-dark.png` |
| RU | Light | `ru-desktop-light.png` | `ru-mobile-light.png` |
| RU | Dark | `ru-desktop-dark.png` | `ru-mobile-dark.png` |

Additional evidence:

- 320 px: `en-320-light.png`, `ru-320-dark.png`
- Reviewer fix round 1 at 320 px: `en-320-normal-top.png`, `ru-320-normal-top.png`,
  `en-320-200-top.png`, `ru-320-200-top.png`
- Final review at 320 px and 200% text: `en-320-200-top.png`, `ru-320-200-top.png`,
  `en-320-200-skip-focus.png`, `ru-320-200-skip-focus.png`,
  `en-320-200-contact.png`, `ru-320-200-contact.png`
- Anchor clearance at 320 px: `en-320-normal-work-anchor.png`,
  `ru-320-normal-work-anchor.png`, `en-320-200-work-anchor.png`,
  `ru-320-200-work-anchor.png`
- Expanded disclosure: `en-case-open-section.png`
- Print: `en-print.png`, `en-print.pdf`

All ten screen states returned HTTP 200, used the requested locale and theme, had zero horizontal
overflow, zero clipped heading text, zero framework overlays, zero browser console warnings/errors,
and a minimum visible header-control target of 44 px.

## Fidelity and QA ledger

| Point | Reference or requirement | Final render evidence | Result |
| --- | --- | --- | --- |
| First viewport hierarchy | Target establishes a quiet floating header, dominant name, role, concise promise, and direct CTA. The approved spec requires proof immediately after the hero. | Desktop keeps the name as the only display-scale element, moves CTA/socials to the lower-right counterweight, and exposes the proof rail within the first 1024 px viewport. | Pass |
| Copy integrity | No invented claims, metrics, employers, tools, or testimonials. | Above-the-fold and downstream strings come only from localized content. EN/RU facts and section order match; no added eyebrow, badge, metric, or testimonial copy. | Pass |
| Evidence and case prominence | Outcomes must be more prominent than the toolkit; cases must show title and result before optional detail. | Three verified facts form a full-width rail. Selected work is the first large section. Result copy remains visible with native closed-by-default `details`. | Pass |
| Typography | Preserve Manrope continuity while strengthening editorial hierarchy and keeping 45–75 character prose. | One self-hosted family, large balanced headings, readable 66ch prose caps, compact labels, and purposefully smaller chronology/toolkit text. | Pass |
| Palette and depth | Neutral white/graphite with one tomato accent; dark elevation through lighter graphite, not heavy shadow. | Light uses near-white plus neutral ruled surfaces. Dark uses `#121315` with lighter `#1b1c1f`/`#242529` surfaces and no dark shadows. Accent is reserved for evidence, roles, focus, and the final edge. | Pass |
| Spacing and container model | Remove repeated equal cards, nested surfaces, workspace tiles, and dashboard repetition. | One 1200 px page container, open hero, border-only proof rail, wide case rows, ruled capabilities, chronology, grouped toolkit, and one decisive contact surface. | Pass |
| Responsive behavior | Single semantic mobile column, no horizontal overflow from 320 to 2560, and 200% text without overflow. | Automated checks cover 320/375/768/1280/2560 at normal and 200% root text. The strict 320 px checks cover EN/RU `body.scrollWidth`, visible element border boxes, and individual text ranges without relying on clipping. The final mobile navigation is a whole-word 2 × 2 layout; EN and RU labels each occupy one unbroken text line at 200%. | Pass |
| Header and sticky behavior | Compact header instead of persistent mobile bottom navigation; controls must not obscure content. | Header remains at the top, four essential mobile links fit, every visible control is at least 44 × 44, and no bottom navigation is rendered. The 2 × 2 narrow navigation raises the 100% header bottom to 178 px; the mobile anchor token now starts at 184 px and continues to scale with root text. Work, Experience, and Contact clear the measured header in EN/RU at 100% and 200%. | Pass |
| Focus visibility | Focus indicator at least 2 px and focused controls remain fully visible. | Automated traversal checks every focusable element. At 320 px and 200% text, the EN/RU skip-link bounds include its 2 px outline plus 3 px offset and remain inside the viewport; fresh focused screenshots confirm both states. | Pass |
| Interaction and motion | Immediate control feedback, 140–260 ms routine transitions, no `transition: all`, reduced-motion fallback, and functional disclosure/theme/navigation. | Case disclosure changes closed → open, theme changes and persists light → dark, current-section changes Home → Contact, durations stay within budget, and reduced motion collapses transitions. | Pass |
| Print | Light, one page, content-first; hide navigation, proof duplication, cases/disclosures, toolkit, and decorative chrome. | PDF page tree reports one A4 page. Print is white with black text, condensed experience, education, email, and explicit social URLs. | Pass |

## Material mismatches found and fixed

1. The Task 3 semantic page was still styled by the removed workspace/card system. Rebuilt the
   stylesheet around the editorial component responsibilities.
2. Header targets were 40 px. Raised every visible header link and button to at least 44 × 44 px.
3. Smooth focus scrolling left the final email off-screen at the instant focus moved. Removed the
   non-essential spatial scroll animation so focus becomes visible immediately.
4. The Russian `Образование` heading overflowed its narrow chronology column while page overflow was
   clipped. Rebalanced the chronology columns, tuned the secondary heading scale, and added a text
   range regression check.
5. Current-section enhancement initialized before `<main>` existed, so its observer watched no
   sections. Deferred initialization to DOM ready and added immediate click state feedback.
6. Expanded case evidence was restricted to a 175 px side column and created a tall empty row. The
   open state now spans 816 px across the evidence side of the row and groups problem/action in two
   readable columns.
7. Print exposed duplicated proof and inherited theme colors. The print system now removes duplicated
   UI and forces black content on a white one-page CV.
8. The original horizontal-overflow gate only compared the clipped document root, hiding real
   out-of-viewport content. With clipping disabled, the reproduced body widths were 366 px for RU
   at 100%, 515 px for EN at 200%, and 706 px for RU at 200%. Removed root/body clipping, reset the
   mobile hero cross-axis and case outcome grid placement, and allowed long headings to wrap.
9. Fixed pixel anchor offsets did not scale with the sticky header: at 200% text each target landed
   about 30 px under the 157.6 px header. The shared offset now keeps a 136 px baseline and scales
   to 6rem; target geometry is asserted in both locales at 100% and 200% text.
10. The Russian skip link ended at the 320 px viewport edge, so its 2 px outline plus 3 px offset was
    clipped. The skip link now has logical inline positioning and a viewport-safe max inline size;
    EN/RU geometry tests include the full outline footprint.
11. The narrow 200% navigation used `overflow-wrap: anywhere`, splitting `Experience` and Russian
    labels inside words. The four essential links now use a 2 × 2 whole-word grid, with the mobile
    sticky-anchor offset updated for the taller real header.
12. Russian education mixed languages, while the primary CTA described only a reliable system.
    The degree is now `Бакалавр, программная инженерия`; the exact CTA is `Discuss a task` /
    `Обсудить задачу`, and the final contact copy explicitly covers infrastructure and product
    development without adding a new claim.
13. In-page section links used `aria-current="page"`, which describes the language switch but not a
    location inside the current page. Section navigation now uses `aria-current="location"` in its
    initial and enhanced states.
14. `LangSwitch` reconstructed target-language names from locale codes. It now consumes the existing
    localized `ui.controls.otherLanguageName` value, protected by a controlled Astro component build.

## Interaction proof

Flow under test: `/` → open the first case story → supporting evidence appears in the wide row;
toggle theme → `data-theme` and `localStorage` both become `dark`; activate Contact navigation →
`aria-current="location"` moves to Contact; focus the email CTA → it remains fully visible with a focus
outline. No console or page errors occurred.

## Reproduce final screenshots

The capture uses only the repository's existing Playwright dependency. In one terminal:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

In another terminal:

```sh
npm run qa:capture -- --output /tmp/mubi-dev-final-qa --base-url http://127.0.0.1:4321
```

The command writes six deterministic 320 × 900 PNGs at 200% root text for EN/RU: top navigation,
focused skip link, and Contact reached through the in-page navigation.

## Automated gates

- Unit: 6 files, 46 tests passed.
- E2E: 92 tests passed in Chromium.
- Build: 2 localized static pages built.

The test runner's parent environment sets `NO_COLOR`; Playwright sets `FORCE_COLOR` for child
processes and can emit an upstream environment warning when both are inherited. Final verification
removes inherited `NO_COLOR`; there are no application, build, framework, browser-console, or
accessibility warnings.

## Sign-off

The latest implementation was visually compared with the accepted continuity reference and the
approved evidence-first specification. No material visual mismatch or unapproved visible copy
remains. The result is suitable for agency sign-off within the requested Astro/CSS scope.
