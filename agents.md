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

- Always:
  - Run tests before commits (`npm run test`)
  - Don't disable GPG signing ask for sign in terminal
  - After every push, automatically retrieve GitHub Actions test output, fix any failures, and re-push until all tests pass
- Ask first:
  - Database schema changes
  - Adding dependencies
- Never:
  - Commit secrets, .env files
  - Edit node_modules/
