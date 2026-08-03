# mubi.dev evidence-first redesign specification

Date: 2026-08-03
Status: approved design, pending implementation plan
Supersedes visual direction in: `2026-07-31-mubi-dev-redesign-design.md`

## 1. Outcome

Refine `mubi.dev` into an evidence-first engineering portfolio for recruiters and engineering
leads. The site must quickly explain who Mubinjon is, what responsibility he takes, which real work
supports those claims, and how to contact him.

The redesign keeps the current positioning: infrastructure engineer and product developer. It
changes the presentation from a decorative modular workspace into a clear editorial narrative.

## 2. Audience and conversion

- Primary audience: international recruiters and engineering leads.
- Secondary audience: Russian-speaking clients and colleagues.
- Primary action: start a conversation by email.
- Secondary actions: inspect selected work and open GitHub, LinkedIn, or Telegram.
- Primary CTA meaning: discuss a task. The localized label must name that outcome naturally in each
  language.

## 3. Design direction

The selected direction is an evidence-first editorial engineering portfolio.

- DESIGN_VARIANCE: 6/10. Asymmetric enough to be memorable, with an unambiguous reading order.
- MOTION_INTENSITY: 3/10. Motion supports navigation and state changes only.
- VISUAL_DENSITY: 5/10. More compact than the current modular page without becoming crowded.
- Visual language: neutral white and graphite surfaces, one tomato-red accent, strong typography,
  and open composition.
- Anti-direction: no fake dashboard, decorative technology graph, repeated bento-card wall, invented
  metrics, vague testimonials, or interaction added only for visual effect.

Manrope remains the sole type family because it supports both Latin and Cyrillic and is already
self-hosted. Typography gains stronger size and weight contrast rather than another font.

## 4. Information architecture

The page uses this order:

1. **Hero**: name, specialization, one concise promise, primary email CTA, and secondary social links.
2. **Evidence**: three or four verified facts derived from existing content about responsibility,
   systems, and kinds of work. No new metric may be published without a source in the repository.
3. **Selected work**: the existing cases presented as problem, decision, and result. Result and title
   remain visible; supporting detail can expand in place.
4. **Capabilities**: Infrastructure, Automation, and Product Development, each linked in content and
   layout to evidence or a case instead of appearing as a generic service card.
5. **Experience and education**: a compact chronology focused on responsibility and progression.
6. **Toolkit**: technologies grouped by purpose as a quiet reference index, not a logo cloud or an
   interactive workspace.
7. **Contact**: repeat the core proposition, make email primary, provide social alternatives, and
   state plainly what the visitor can do next.

Desktop may use asymmetric columns where they improve scanning. Mobile is one continuous column in
the same semantic order.

## 5. Component responsibilities

- `Header`: primary navigation, current-section state, language switch, and theme control.
- `Hero`: identity, positioning, primary CTA, and social links.
- `Proof`: verified evidence statements derived from content.
- `Cases`: visible outcome summaries and progressively disclosed supporting detail.
- `Capabilities`: three responsibility areas connected to proof and work.
- `Experience`: work chronology and education.
- `Toolkit`: grouped technology index.
- `Contact`: final conversion point and communication alternatives.

Components must not own localized copy. Public strings remain in content collections. Existing
content schemas may be extended with explicit fields, with structurally equivalent and genuinely
translated RU and EN entries.

## 6. Visual system

- Light canvas: neutral near-white. Dark canvas: graphite, not pure black.
- Surfaces communicate grouping only. Avoid nesting cards and avoid pairing a module border with a
  large decorative shadow.
- Tomato red is the only brand accent. Green is reserved for real success or availability semantics.
- Comfortable prose measure is 45 to 75 characters. Headings use balanced wrapping; prose uses
  natural wrapping.
- Interactive targets aim for at least 44 by 44 CSS pixels and never fall below WCAG 2.2 AA target
  requirements.
- Keyboard focus uses a visible two-pixel-or-stronger indicator with at least 3:1 state contrast.
- Mobile navigation must not obscure content or focused elements. A compact header is preferred over
  the current persistent five-item bottom bar.

## 7. Interaction and motion

- Core content, case summaries, contact links, and page navigation work without JavaScript.
- JavaScript is limited to theme persistence and current-section enhancement.
- Case detail uses native, accessible disclosure semantics.
- Feedback begins immediately. Routine transitions use existing 140 to 260 millisecond tokens and
  animate transform or opacity only.
- `prefers-reduced-motion: reduce` removes non-essential spatial motion.
- Theme follows the system when no saved preference exists and persists an explicit selection.
- Hover is never required to discover content or complete an action.

## 8. Content integrity

- Keep all existing real employers, cases, technologies, contacts, and dates unless content review
  finds an internal contradiction.
- Do not invent employers, clients, projects, scale, metrics, testimonials, certifications, or
  technology usage.
- Evidence statements must be traceable to existing profile, experience, case, or stack content.
- Technologies appear in the context where they support a decision; the toolkit remains secondary.
- RU and EN express the same facts naturally rather than copying sentence structure mechanically.

## 9. Failure handling and progressive enhancement

The current local pages return HTTP 500 because UI content is unresolved before
`skipToContent` is read. Implementation starts by finding and fixing the content-loading root cause
and adding a regression test that renders both `/` and `/ru/`.

If client-side navigation enhancement does not run, anchor navigation remains functional. If theme
persistence is unavailable, the page follows the system theme. No essential content is introduced
only through animation, hover, or a client-side state transition.

## 10. Responsive, accessibility, and performance requirements

- No horizontal page overflow from 320 to 2560 CSS pixels.
- Verify desktop at 1440 by 1024 and mobile at 390 by 844, plus a 320-pixel narrow viewport.
- Verify both locales and both themes.
- Text scales to 200 percent without clipping, overlap, or loss of operation.
- The skip link remains the first focusable element; headings, landmarks, lists, links, and
  disclosures remain semantic.
- Sticky UI does not obscure keyboard focus, satisfying WCAG 2.2 Focus Not Obscured.
- Text contrast is at least 4.5:1; non-text UI and focus indicators are at least 3:1.
- Field Interaction to Next Paint target is 200 milliseconds or less at the 75th percentile on
  mobile and desktop. Static architecture and minimal JavaScript protect this budget.
- Generated output reserves stable geometry for fonts and icons to avoid visible layout shift.

## 11. Print

Print remains a compact, light, one-page CV. Navigation, theme controls, decorative surfaces, motion,
and non-essential interaction are removed. Contact details and condensed experience remain readable.

## 12. Verification and completion

Required gates:

- `npm test`
- `npm run test:e2e`
- `npm run build`

Browser verification covers desktop, mobile, 320-pixel width, RU and EN, light and dark themes,
keyboard navigation, case disclosure, theme persistence, navigation, console health, 200 percent
text zoom, and print.

Visual QA compares the approved redesign reference, the pre-change production page, and the final
render. It records at least copy, first-viewport hierarchy, case prominence, typography, palette,
spacing, responsive behavior, focus visibility, and sticky-navigation behavior.

The redesign is complete only when both routes render successfully, the required gates pass, no
material visual defect remains, real evidence is more prominent than the technology list, and the
primary contact path works. Publishing and deployment require a separate explicit command.
