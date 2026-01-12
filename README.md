# loylt - Digital Loyalty Stamp Cards

Multi-tenant QR-based loyalty stamp card system built with SvelteKit and Postgres.

## Features

- **For Customers**: Scan QR codes to collect stamps anonymously
- **For Establishments**: Password-protected admin dashboard to manage loyalty programs
- **Multi-tenant**: Support for multiple establishments in one deployment
- **QR Code Generation**: One-time use tokens prevent fraud
- **Analytics**: Track total stamps and per-customer usage

## Tech Stack

- **Frontend/Backend**: SvelteKit (pages + API routes)
- **Database**: PostgreSQL (local via Docker, Vercel Postgres for production)
- **Development**: Docker Compose
- **Deployment**: Vercel

## Development Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose

### Getting Started

1. **Clone and install dependencies**:

   ```bash
   npm install
   ```

2. **Start the development environment**:

   ```bash
   docker-compose up
   ```

   This starts both PostgreSQL and the SvelteKit dev server.

3. **Run database migrations** (in a new terminal):

   ```bash
   docker compose exec app npm run migrate
   ```

4. **Seed test data** (optional):

   ```bash
   docker compose exec app npm run seed
   ```

   This creates a test establishment with ID and password displayed in the output.

5. **Access the application**:
   - App: <http://localhost:5173>
   - Setup page: <http://localhost:5173/setup>

## Project Structure

```text
src/
├── lib/
│   ├── components/       # Svelte components
│   │   ├── StampGrid.svelte
│   │   ├── QRDisplay.svelte
│   │   └── AnalyticsTable.svelte
│   ├── db/              # Database utilities
│   │   ├── connection.ts
│   │   ├── queries.ts
│   │   └── types.ts
│   └── utils/           # Helper functions
│       ├── auth.ts
│       └── tokens.ts
├── routes/
│   ├── api/             # API endpoints
│   │   ├── tokens/
│   │   └── establishments/
│   ├── stamp/[establishment_id]/   # Customer stamp page
│   ├── admin/[establishment_id]/   # Admin dashboard
│   └── setup/           # Establishment onboarding
└── app.css              # Global styles

scripts/
├── migrate.js           # Database migrations
└── seed.js              # Test data seeding
```

## Usage

### Creating an Establishment

1. Visit `/setup` page
2. Enter establishment name and password
3. Save the generated establishment ID and admin URL

### Admin Dashboard

- Access: `/admin/{establishment_id}`
- Login with your password
- Generate QR codes for transactions
- Configure stamp card size and name
- View analytics

### Customer Flow

1. Customer scans QR code at point of sale
2. Lands on stamp page with auto-applied stamp
3. Returns to same URL to view progress
4. Completes card when all stamps collected

## Database Schema

### establishments

- `id` (UUID, primary key)
- `name` (VARCHAR)
- `password_hash` (VARCHAR)
- `grid_size` (INTEGER, default 9)
- `created_at` (TIMESTAMP)

### transactions

- `id` (UUID, primary key)
- `token` (VARCHAR, unique)
- `establishment_id` (UUID, foreign key)
- `customer_guid` (UUID)
- `used` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `used_at` (TIMESTAMP)

## Environment Variables

Development (`.env`):

```sh
DATABASE_URL=postgresql://loylt:loylt_dev@localhost:5432/loylt
PASSWORD_SALT=dev_salt_change_in_production
```

Production (Vercel):

```sh
POSTGRES_URL=<vercel-postgres-url>
PASSWORD_SALT=<secure-random-salt>
```

## Deployment

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Set up Vercel Postgres database
3. Configure environment variables in Vercel dashboard
4. Deploy: `vercel --prod`
5. Run migrations on production database

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed test data
- `npm test` - Run all tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report

## Testing

Comprehensive test suite covering unit tests, integration tests, and E2E tests.

See [TESTING.md](TESTING.md) for detailed testing documentation.

### Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run integration tests (requires test database)
npm test src/tests/integration/
```

## License

Apache License 2.0
