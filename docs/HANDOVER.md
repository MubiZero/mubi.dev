# Handover: keeping the CV current

The initial CV content is filled in English and Russian. Keep both language files current when a
role, project, contact link, or core technology changes.

The page opens on identity and the measured results, then capabilities, then the cases that carry
those results in full. The two figures in the hero are a summary of the **Cases** section, not a
separate claim: change one and change the other in the same edit.

When changing content:

- Keep the EN and RU structures identical. `npm test` rejects missing counterparts.
- Do not use an em dash in English copy. The copy test rejects it.
- `public/og.png` is a committed 1200x630 image with no generator in this repository. If the hero
  text changes enough to make it wrong, redraw it by hand and keep those dimensions, because the
  head declares them.
- Run `npm run check && npm test && npm run test:e2e && npm run build` before deployment. CI runs
  the same sequence on every push.
- Keep navigation, section titles, capability labels, the hero figures, and accessibility labels in
  `src/content/copy/{en,ru}.yaml`; never hardcode one locale in a component. `ui/{en,ru}.yaml` holds
  only the document title, the meta description, and the theme and language control labels.
- Keep technology names in `src/content/stack/{en,ru}.yaml`. The toolkit section derives from them.

For a new experience entry, add the detailed version to `entries` and a short, outcome-led version
to `printEntries` in `src/content/experience/{en,ru}.yaml`. This keeps the website informative and
the browser's printed A4 CV concise.
