# loylt - Digital Loyalty Stamp Cards

Multi-tenant QR-based loyalty stamp card system built with SvelteKit and Postgres.

## Features

- **For Customers**: Scan QR codes to collect stamps anonymously
- **For Establishments**: Admin dashboard with per-user authentication to manage loyalty programs
- **Superuser**: Higher-level admin view across all establishments
- **Multi-tenant**: Support for multiple establishments in one deployment
- **QR Code Generation**: Reusable tokens with per-customer deduplication prevent fraud
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
2. Enter establishment name, admin email, and password
3. You'll be automatically logged in and redirected to the admin dashboard
4. Save the generated establishment ID and admin URL

### Admin Dashboard

- Login at `/login` with your email and password
- Establishment admins are redirected to their establishment dashboard
- Generate QR codes for transactions
- Configure stamp card size and name
- Manage admin users (add/remove) for the establishment
- View analytics

### Creating a Superuser

Superusers can view and manage all establishments. They can only be created via the command line:

```bash
# Inside Docker
docker compose exec app npm run create-superuser -- --email admin@loylt.com --password yourpassword

# Or directly (with DATABASE_URL set)
npm run create-superuser -- --email admin@loylt.com --password yourpassword
```

Superusers log in at `/login` and see a list of all establishments at `/admin`.

### Customer Flow

1. Customer scans QR code at point of sale
2. Lands on stamp page with auto-applied stamp
3. Returns to same URL to view progress
4. Completes card when all stamps collected

## Database Schema

### establishments

- `id` (UUID, primary key)
- `name` (VARCHAR)
- `grid_size` (INTEGER, default 9)
- `created_at` (TIMESTAMP)

### admin_users

- `id` (UUID, primary key)
- `email` (VARCHAR, unique)
- `password_hash` (VARCHAR)
- `role` (VARCHAR: `establishment_admin` or `superuser`)
- `establishment_id` (UUID, foreign key → establishments, null for superusers)
- `created_at` (TIMESTAMP)

### sessions

- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → admin_users)
- `expires_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

### transactions

- `id` (UUID, primary key)
- `token` (VARCHAR, unique) - reusable across multiple customers
- `establishment_id` (UUID, foreign key)
- `customer_guid` (UUID, legacy)
- `used` (BOOLEAN, legacy)
- `created_at` (TIMESTAMP)
- `used_at` (TIMESTAMP, legacy)

### token_redemptions

Tracks per-customer redemptions. Multiple customers can redeem the same token, but each customer can only redeem a given token once.

- `id` (UUID, primary key)
- `transaction_id` (UUID, foreign key → transactions)
- `customer_guid` (UUID, not null)
- `redeemed_at` (TIMESTAMP)
- Unique constraint on `(transaction_id, customer_guid)`

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
5. **Run migrations on production database**:

   ```bash
   # Link your project (first time only)
   vercel link

   # Pull environment variables from Vercel
   vercel env pull .env.production.local

   # Run migrations using production database
   DATABASE_URL=$(grep POSTGRES_URL .env.production.local | cut -d '=' -f2-) node scripts/migrate.js
   ```

   **Verify migrations**:

   ```bash
   # Connect to production database
   psql "your-postgres-url-from-vercel"

   # Check tables were created
   \dt

   # Verify table structure
   \d establishments
   \d transactions
   \d token_redemptions
   ```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed test data
- `npm run create-superuser -- --email <email> --password <password>` - Create a superuser
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
