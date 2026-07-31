# Handover: keeping the CV current

The initial CV content is filled in English and Russian. Keep both language files current when a
role, project, contact link, or core technology changes.

When changing content:

- Keep the EN and RU structures identical. `npm test` rejects missing counterparts.
- Do not use an em dash in English copy. The copy test rejects it.
- Regenerate `public/og.png` after changing the hero text.
- Run `npm test && npm run test:e2e && npm run build` before deployment.

For a new experience entry, add the detailed version to `entries` and a short, outcome-led version
to `printEntries` in `src/content/experience/{en,ru}.yaml`. This keeps the website informative and
the browser's printed A4 CV concise.
