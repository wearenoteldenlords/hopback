# hopback

_Hop back into any client, instantly._

A context-container workspace for people juggling several clients at once: fast workspace
switching, a per-client resource hub, one calendar for every deadline, and a "Where was I?"
note for each workspace. See [`docs/session_context.md`](docs/session_context.md) for the full
product and technical context.

## Requirements

- Node.js 24 (`.nvmrc`)
- pnpm 12, via Corepack: `corepack enable`
- Docker (local Postgres)

## Getting started

```sh
pnpm install
pnpm db:up        # Postgres 16 on localhost:5432 (override with POSTGRES_PORT)
pnpm dev          # api on :3000, web on :5173
```

## Scripts

| Command                        | What it does                               |
| ------------------------------ | ------------------------------------------ |
| `pnpm build`                   | Build every package (Turborepo, cached)    |
| `pnpm lint`                    | ESLint, including architectural boundaries |
| `pnpm typecheck`               | `tsc --noEmit` in every package            |
| `pnpm test`                    | Unit tests (Vitest)                        |
| `pnpm format` / `format:check` | Prettier                                   |
| `pnpm db:up` / `db:down`       | Start / stop the local Postgres container  |

## Layout

```
apps/
  api/          NestJS REST API
  web/          Vite + React shell for the browser
packages/
  app/          all frontend features (shared by web and the future desktop shell)
  ui/           shared UI components
  platform/     Platform interface implemented by each shell
  contracts/    Zod schemas shared by the API and the frontend
  config/       shared tsconfig presets
infra/          docker-compose files
```

Dependencies only point from `apps/*` to `packages/*`, never back. The allowed edges are listed
in [`eslint.config.js`](eslint.config.js) and enforced by `eslint-plugin-boundaries`.

Workspace packages are consumed from their TypeScript source through the `@hopback/source`
export condition, so typecheck and the Vite dev server need no prior build. Only
`@hopback/contracts` is compiled, because the API loads it at runtime in Node.
