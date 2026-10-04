# AGENTS.md

Repository-level guidance for AI agents working in this project. Explicit user instructions take precedence over this file.

## Project

- A reusable GitHub Template Repository for fast prototypes on Hono + Cloudflare Workers + D1, deployed with Wrangler through GitHub Actions.
- Every instantiated repo is a standalone project: assume the new repository name is the intended project name unless the user explicitly overrides it.

## Commands

- `npm install` - install dependencies (`postinstall` runs `npm run sync:project`)
- `npm run dev` - local Wrangler dev server
- `npm test` - Vitest suite; `npm run typecheck` - TypeScript check
- `npm run db:reset:local` - rebuild the local D1 database from scratch and reapply migrations
- `npm run db:ensure:remote` / `npm run db:migrate:remote` - remote D1 database operations
- `npm run sync:project` - sync project naming into `package.json`, `wrangler.jsonc`, and `src/project.ts`
- `npm run deploy` - sync naming, then `wrangler deploy`

## Naming

- The project name is the single naming source:
  - Worker name: `[project-name]`
  - D1 database name: `[project-name]-prod`
  - workers.dev URL: `https://[project-name].<workers-dev-subdomain>.workers.dev`
- Keep `npm run sync:project` as the source of truth; do not hardcode a second competing naming scheme.
- Run or preserve the `sync:project` workflow before changing naming-sensitive files.

## Auth and Data

- All write operations against app data must remain behind database-backed authentication. Do not re-open public write access to D1-backed routes unless the user explicitly asks for it.
- Protect data-reading routes as well when the data is prototype-private, unless the user explicitly asks for public reads.
- Keep auth database-backed (users and sessions in D1) and extensible. Do not replace it with hardcoded in-memory credentials.
- The initial admin account is fixed as `admin`; its password comes from the `ADMIN_PASSWORD` Worker secret in deployed environments and the local `ADMIN_PASSWORD` environment variable in development. Never hardcode a password in source.
- Keep the admin bootstrap simple: lazily create the `admin` user during login instead of adding separate migration bootstrap scripts unless the user explicitly asks for them.
- Assume `workers.dev` deployments are publicly reachable. Before allowing browser interaction that mutates D1, verify the route is guarded; if a route becomes public by design, document it explicitly.
- If auth or session behavior changes, update tests to verify unauthenticated rejection and authenticated success.

## Database

- Prefer Wrangler local D1 backed by persisted SQLite state under `.wrangler/state`.
- When a clean local database is needed, use `npm run db:reset:local` instead of inventing ad hoc cleanup steps.
- Keep migrations readable and preserve numeric filename prefixes; ordering depends on them.
- Auth-related schema changes must preserve a path for bootstrapping a fresh environment from zero.
- If `ADMIN_PASSWORD` changes locally outside a GitHub Actions deploy, reset the database or update the `admin` record explicitly.

## Deployment

- First deploy is not fully automatic. It requires `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `ADMIN_PASSWORD` as GitHub Actions secrets, and the same names as local environment variables. Do not imply otherwise.
- Deploy automation must fail fast and clearly name any missing required Actions secrets before running Cloudflare commands.
- The deploy workflow uploads or refreshes the Worker secret before deploying code that depends on it, and refreshes the remote D1 `admin` password from `ADMIN_PASSWORD` after migrations run.
- Document `CLOUDFLARE_API_TOKEN` permissions as two stages: a bootstrap token that can create the Worker and the D1 database, then a scoped token (Workers Editor limited to this Worker, plus D1 Edit).
- The Cloudflare account must already have a `workers.dev` subdomain before the first deploy. Brand-new accounts need a one-time dashboard registration at `https://dash.cloudflare.com/<account-id>/workers/onboarding`; CI cannot register it and the first upload fails with error 10063.
- After switching to the scoped token, renaming the repository changes the Worker name through `sync:project`, so update the token's Worker scope or deploy once with the bootstrap token.

## Documentation

- Keep `README.md` short and human-focused. Put irreversible/manual operator steps (GitHub secrets, Cloudflare credentials, local secret files) first and clearly separate human-only setup from AI-automatable steps.
- Present GitHub Actions secrets and local permanent environment variables as the same required credential set.
- Move detailed development conventions into agent instructions (this file) rather than bloating the README.
- When changing schema, auth, deployment, or template usage, update the relevant instructions in the same change. These instructions are expected to evolve continuously with the project.
