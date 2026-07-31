# Handover: keeping the CV current

The initial CV content is filled in English and Russian. Keep both language files current when a
role, project, contact link, or core technology changes.

The public page uses a modular personal-homepage layout. Identity and capabilities come first;
engineering cases are supporting proof in the **Selected work** section. Do not promote one case to
the hero unless it becomes the owner's primary public positioning.

When changing content:

- Keep the EN and RU structures identical. `npm test` rejects missing counterparts.
- Do not use an em dash in English copy. The copy test rejects it.
- Regenerate `public/og.png` after changing the hero text.
- Run `npm test && npm run test:e2e && npm run build` before deployment.
- Keep navigation, capability labels, workspace copy, and accessibility labels in
  `src/content/ui/{en,ru}.yaml`; never hardcode one locale in a component.
- Keep technology names in `src/content/stack/{en,ru}.yaml`. The workspace and toolkit both derive
  from these files.

For a new experience entry, add the detailed version to `entries` and a short, outcome-led version
to `printEntries` in `src/content/experience/{en,ru}.yaml`. This keeps the website informative and
the browser's printed A4 CV concise.
