# Hono GitHub Cloudflare Template

A Hono + Cloudflare Workers + D1 template for fast prototyping.

## Human Setup Required

These steps cannot be completed automatically by AI.

Configure the same credential set in both places:

1. GitHub Actions secrets in the new repository:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `ADMIN_PASSWORD`
2. Permanent environment variables on your local machine:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `ADMIN_PASSWORD`

This template intentionally uses the same variable names locally and in GitHub so development and deployment do not drift into separate configuration schemes.

### `CLOUDFLARE_API_TOKEN` Permissions

Use two tokens: a bootstrap token for the first deploy, then a scoped token for every deploy after that. Only the value changes; the variable name stays `CLOUDFLARE_API_TOKEN` in GitHub Actions and locally.

| Stage | Permissions |
| --- | --- |
| Bootstrap (first deploy) | Account → Workers → Admin, scoped to all Workers in the account, and Account → D1 → Edit (`D1 Write` in the API). This deploy creates the Worker and the D1 database `[project-name]-prod`. |
| Scoped (recommended afterwards) | Account → Workers → Editor, scoped to the individual Worker `[project-name]`, and Account → D1 → Edit (`D1 Write`). Covers `wrangler deploy`, `wrangler secret put`, and all `wrangler d1` commands. |

Keep both tokens scoped to this account with no Zone permissions, and delete the bootstrap token after switching.

The account must already have a `workers.dev` subdomain before the first deploy. On a brand-new account, register one at `https://dash.cloudflare.com/<account-id>/workers/onboarding`; GitHub Actions cannot do this, and the first upload fails with error 10063 until it exists.

## Template Defaults

- The repository name, folder name, and Worker name are all treated as `[project-name]`
- The D1 database name is always `[project-name]-prod`
- The deployment URL is `https://[project-name].<your-workers-dev-subdomain>.workers.dev`
- `npm run sync:project` syncs naming into `package.json`, `wrangler.jsonc`, and `src/project.ts`

## Security Notes

- Anyone can open the dev page
- Reading and modifying todo data requires login
- The initial username is always `admin`
- The initial password comes from the Worker secret `ADMIN_PASSWORD` in deployed environments, and from the local `ADMIN_PASSWORD` environment variable during local development
- The app still supports lazily creating the `admin` user on the first successful login using the current `ADMIN_PASSWORD`
- Every GitHub Actions deploy syncs both the remote Worker secret and the remote D1 `admin` password to the latest `ADMIN_PASSWORD`
- If you change `ADMIN_PASSWORD` locally, run `npm run db:reset:local` or update that user's password manually
- Authentication is database-backed, with users and sessions stored in D1 for future extension

## Quick Start

### Local

First configure `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `ADMIN_PASSWORD` as permanent environment variables on your system, then run:

```bash
npm install
npm run db:reset:local
npm run dev
```

`db:reset:local` rebuilds the local Wrangler D1 database from scratch and reapplies migrations. It is the preferred way to start fresh locally or let AI reset the local database safely.

### Test

```bash
npm test
npm run typecheck
```

### Deploy

The first deploy creates both the Worker and the D1 database, so it requires the bootstrap token described in Human Setup Required. Switch to the scoped token once the Worker exists.

After you push or merge to `main`, the deploy workflow will:

1. Check that `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `ADMIN_PASSWORD` all exist as Actions secrets, and fail immediately with the missing secret name if any are absent
2. Install dependencies
3. Sync the project name
4. Run type checking and tests
5. Ensure the remote D1 database `[project-name]-prod` exists
6. Upload the Worker secret `ADMIN_PASSWORD`
7. Run remote migrations
8. Sync the remote D1 `admin` password to the latest `ADMIN_PASSWORD`
9. Deploy the Worker

## Minimal App

The template ships with a minimal working page that:

- Uses the D1 `todos` table
- Includes basic HTML, CSS, and JS
- Supports login
- Supports creating todos
- Supports toggling completion status

## Common Commands

```bash
npm run sync:project
npm run db:reset:local
npm run db:migrate:remote
npm run db:ensure:remote
npm run dev
npm test
```
