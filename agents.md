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
