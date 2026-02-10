# loylt

## Objective

Multi-tenant QR-based loyalty stamp card system built with SvelteKit and Postgres.

## Tech Stack

- Frontend/Backend: SvelteKit (pages + API routes)
- Database: PostgreSQL (local via Docker, Vercel Postgres for production)
- Development: Docker Compose
- Deployment: Vercel

## Commands

- Build: `npm run build`
- Test: `npm run test`

## Project Structure

- `src/` – Application source code
- `src/tests/` – Unit and integration tests
- `scripts` - Utilty scripts for init and dev

## Boundaries

- Always do:
  - Always run tests before commits (`npm run test`)
  - After every push, automatically retrieve GitHub Actions test output, fix any failures, and re-push until all tests pass
- Ask first:
  - Database schema changes
  - Adding dependencies
  - Ask for GPG signing in terminal
- Never do:
  - Commit secrets, .env files
  - Edit node_modules/
  - Remove a failing test without explicit approval
  - Don't disable GPG signing

## Key File Locations
- DB schema/migration: `scripts/migrate.js` (single-file, non-versioned `CREATE TABLE IF NOT EXISTS`)
- DB queries: `src/lib/db/queries.ts`
- DB types: `src/lib/db/types.ts`
- DB connection: `src/lib/db/connection.ts`
- Token validation API: `src/routes/api/tokens/validate/+server.ts`
- Token generation API: `src/routes/api/tokens/generate/+server.ts`
- Customer stamp page: `src/routes/stamp/[establishment_id]/+page.svelte`
- Admin dashboard: `src/routes/admin/[establishment_id]/+page.svelte`
- QR display component: `src/lib/components/QRDisplay.svelte`

## Architecture Notes
- Stamp counts are tracked client-side in localStorage (`loylt_stamps_{estId}`, `loylt_customer_{estId}`)
- Customer identity is a random UUID stored in localStorage (anonymous, per-establishment)
- Token flow: admin generates token → embedded in QR URL → customer scans → `/stamp/{estId}?token={token}` → POST to `/api/tokens/validate`
- `token_redemptions` table tracks per-customer redemptions (added to fix single-use bug). `transactions.used`/`customer_guid`/`used_at` are legacy columns.
- Migration script is not versioned — uses `CREATE TABLE IF NOT EXISTS`. Schema changes to existing tables need `ALTER TABLE` added manually.

## Test Setup
- Unit tests mock `$lib/db/connection` query function via `vi.mock`
- Integration tests (`src/tests/integration/database.test.ts`) require a running Postgres and use `describe.skipIf` when DB unavailable
- Test environment uses jsdom with localStorage/sessionStorage available
- Always run `npm run test` before commits (per CLAUDE.md)
