# mubi.dev

Personal CV site for Mubinjon Mukhamedov. It uses Astro static output and deploys to Coolify.

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

## Coolify

Coolify builds the root `Dockerfile`. It compiles the site with `npm ci && npm run build`, then nginx serves only the
resulting `dist` files on port 80. The static site does not require environment variables.
