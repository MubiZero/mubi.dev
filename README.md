# mubi.dev

Personal CV site for Mubinjon Mukhamedov. It uses Astro static output and is prepared for Cloudflare Pages.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts a local server on port 4321 |
| `npm run build` | Builds static files into `dist/` |
| `npm run preview` | Serves the built output locally |
| `npm test` | Runs content schema, locale parity, copy and contrast tests |
| `npm run test:e2e` | Runs Playwright interaction, accessibility, responsive and print tests |

## Content

All copy is in `src/content/<section>/{en,ru}.yaml`. Both locales must use the same data shape.
See [docs/HANDOVER.md](docs/HANDOVER.md) for every placeholder that requires real information.

## Design

The design specification is [docs/superpowers/specs/2026-07-31-mubi-dev-design.md](docs/superpowers/specs/2026-07-31-mubi-dev-design.md).
Color, spacing, type and motion tokens live in `src/styles/tokens.css`.

## Cloudflare Pages

Use `npm run build` as the build command and `dist` as the output directory. The static site does not require environment variables.
