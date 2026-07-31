# mubi.dev

[mubi.dev](https://mubi.dev) is the bilingual personal CV and developer portfolio of [Mubinjon Mukhamedov](https://www.linkedin.com/in/mubizero). The site is static, fast to load, and designed to work equally well as a web page and a one-page printable CV.

## What is included

- English at `/` and Russian at `/ru/`
- Modular personal homepage with an interactive workspace, capabilities, selected work, experience, education, and contacts
- Light and dark themes, with the choice remembered in the browser
- Responsive layout, keyboard navigation, visible focus states, and reduced-motion support
- A4 print layout, so the current page can be saved as a PDF without maintaining a second CV file

## Stack

- [Astro](https://astro.build/) for static rendering
- Tailwind CSS 4 for utility styles, backed by shared CSS design tokens
- Vitest for content, localisation, and contrast checks
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
| `npm test` | Validate content schemas, locale parity, English copy rules, and colour contrast. |
| `npm run test:e2e` | Run browser interaction, accessibility, responsive, and print tests. |

Before publishing a site change, run:

```bash
npm test
npm run test:e2e
npm run build
```

## Updating the CV

All public copy is separated from the components. Edit the matching English and Russian YAML files under `src/content/`:

| Section | Files |
| --- | --- |
| Profile and navigation labels | `profile/{en,ru}.yaml` |
| Work history and print-only condensed entries | `experience/{en,ru}.yaml` |
| Education | `education/{en,ru}.yaml` |
| Selected engineering cases | `cases/{en,ru}.yaml` |
| Skills and contacts | `stack/{en,ru}.yaml`, `contact/{en,ru}.yaml` |
| Interface labels | `ui/{en,ru}.yaml` |

Keep both locales structurally identical. The test suite intentionally fails if a field is added in only one language. For content conventions and a short maintenance checklist, see [docs/HANDOVER.md](docs/HANDOVER.md).

## Print a CV

Open either language version in a browser and use **Print** / `Ctrl+P` (or `Cmd+P`). The print stylesheet targets a single A4 page and omits navigation and theme controls. No separately generated PDF is stored in the repository.

## Deployment

The production site is deployed by Coolify from the `main` branch using the root [Dockerfile](Dockerfile):

1. Node installs locked dependencies and runs `npm run build`.
2. A minimal nginx image serves only the generated `dist/` files on port `80`.

The site needs no runtime environment variables or database. DNS and TLS are managed outside this repository.

## Project documentation

- [Current redesign specification](docs/superpowers/specs/2026-07-31-mubi-dev-redesign-design.md)
- [Current redesign plan](docs/superpowers/plans/2026-07-31-mubi-dev-redesign.md)
- [Original site specification](docs/superpowers/specs/2026-07-31-mubi-dev-design.md)
- [Content handover](docs/HANDOVER.md)
