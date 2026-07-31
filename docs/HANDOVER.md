# Handover: real facts to add

The site is intentionally built with marked placeholders rather than invented experience or
contact details. Replace every `TODO` below in both language files before publishing.

| File | Field | What to add |
|---|---|---|
| `src/content/profile/{en,ru}.yaml` | `summary[1]` | One sentence about the next role or work you want |
| `src/content/experience/{en,ru}.yaml` | first entry `lines` | Two lines about your Bank Eskhata scope |
| `src/content/experience/{en,ru}.yaml` | second entry | Employer, years, role, responsibilities |
| `src/content/cases/{en,ru}.yaml` | both entries | Case name, problem, action, measurable result |
| `src/content/contact/{en,ru}.yaml` | `email` | Personal email address |
| `src/content/contact/{en,ru}.yaml` | `links` | GitHub, LinkedIn and Telegram URLs |

When changing content:

- Keep the EN and RU structures identical. `npm test` rejects missing counterparts.
- Do not use an em dash in English copy. The copy test rejects it.
- Regenerate `public/og.png` after changing the hero text.
- Run `npm test && npm run test:e2e && npm run build` before deployment.
