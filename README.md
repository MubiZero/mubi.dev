# mubi.dev

[mubi.dev](https://mubi.dev) is the bilingual personal CV and developer portfolio of [Mubinzhon Mukhamedov](https://www.linkedin.com/in/mubizero). The site is static, fast to load, and designed to work equally well as a web page and a one-page printable CV.

## What is included

- English at `/` and Russian at `/ru/`
- One page per locale: the hero with its measured results, capabilities, selected cases, track, toolkit, public code, and contacts
- Light and dark themes, with the choice remembered in the browser
- Responsive layout, keyboard navigation, visible focus states, and reduced-motion support
- A4 print layout, so the current page can be saved as a PDF without maintaining a second CV file

## Stack

- [Astro](https://astro.build/) for static rendering
- Hand-written CSS in `src/styles/`, backed by shared design tokens in `tokens.css`
- Vitest for schema, content, localisation, and contrast checks
- Playwright and axe-core for browser, accessibility, responsive, and print checks
- nginx in a multi-stage Docker build for production

## Run locally

```bash
npm ci
npm run dev
```

The development server is available at `http://localhost:4321`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Build the static site into `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run check` | Typecheck every `.ts` and `.astro` file with `astro check`. |
| `npm test` | Parse the published YAML with its schemas, and check locale parity, English copy rules, and colour contrast. |
| `npm run test:e2e` | Run browser interaction, accessibility, responsive, and print tests. |

Before publishing a site change, run:

```bash
npm run check
npm test
npm run test:e2e
npm run build
```

The same sequence runs on every push and pull request in
[.github/workflows/ci.yml](.github/workflows/ci.yml). The browser suite needs
its browser once per machine:

```bash
npx playwright install --with-deps chromium
```

## Updating the CV

All public copy is separated from the components. Edit the matching English and Russian YAML files under `src/content/`:

| Section | Files |
| --- | --- |
| Name, current role, summary, hero CTA label | `profile/{en,ru}.yaml` |
| Hero thesis, availability line, headline figures, section titles, every other on-page label | `copy/{en,ru}.yaml` |
| Work history and print-only condensed entries | `experience/{en,ru}.yaml` |
| Education | `education/{en,ru}.yaml` |
| Selected engineering cases | `cases/{en,ru}.yaml` |
| Skills and contacts | `stack/{en,ru}.yaml`, `contact/{en,ru}.yaml` |
| Public repositories, by name and description | `repos/{en,ru}.yaml` |
| Document title, meta description, theme and language controls | `ui/{en,ru}.yaml` |

Keep both locales structurally identical. The test suite intentionally fails if a field is added in only one language, and every file is parsed with its schema by `npm test`. For content conventions and a short maintenance checklist, see [docs/HANDOVER.md](docs/HANDOVER.md).

## Print a CV

Open either language version in a browser and use **Print** / `Ctrl+P` (or `Cmd+P`). The print stylesheet targets a single A4 page and omits navigation and theme controls. No separately generated PDF is stored in the repository.

## Deployment

The production site is deployed by Coolify from the `main` branch using the root [Dockerfile](Dockerfile):

1. Node installs locked dependencies and runs `npm run build`.
2. A minimal nginx image serves only the generated `dist/` files on port `80`.

The site needs no runtime environment variables or database. DNS and TLS are managed outside this repository.

## Project documentation

Newest first, so the current design is the one at the top.

- [Evidence-first redesign specification](docs/superpowers/specs/2026-08-03-mubi-dev-evidence-first-redesign-design.md) and its [plan](docs/superpowers/plans/2026-08-03-mubi-dev-evidence-first-redesign.md), which describe the site as it stands
- [Design QA audit](docs/superpowers/audits/2026-08-03-mubi-dev-evidence-first-design-qa.md)
- Superseded: the [first redesign](docs/superpowers/specs/2026-07-31-mubi-dev-redesign-design.md) and the [original site specification](docs/superpowers/specs/2026-07-31-mubi-dev-design.md)
- [Content handover](docs/HANDOVER.md)

## License

`SPDX-License-Identifier: MIT`

The code in this repository is distributed under the [MIT License](LICENSE).
The licence covers the code, not the content: the text, the CV data under
`src/content/`, and the portrait remain the author's and are not granted for
reuse.
