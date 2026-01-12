## Plan: Multi-Tenant QR Loyalty Stamp System

### Overview
SvelteKit app on Vercel enabling multiple establishments to run digital stamp card programs. Customers scan QR codes to collect stamps anonymously (localStorage-based), establishments manage their programs via password-protected admin dashboards.

### Architecture
- **Frontend/Backend**: SvelteKit (pages + API routes) deployed on Vercel
- **Database**: Postgres with multi-tenant schema (Vercel Postgres for prod, local Postgres via Docker for dev)
- **Development**: Docker Compose orchestrating SvelteKit dev server + Postgres database
- **Auth**: Simple password-based per establishment
- **Customer Identity**: Anonymous GUIDs in localStorage (per-establishment scoped)
- **Token System**: One-time transaction tokens preventing replay attacks

### Database Schema
```sql
establishments (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  grid_size INTEGER DEFAULT 10,
  created_at TIMESTAMP
)

transactions (
  id UUID PRIMARY KEY,
  token VARCHAR(255) UNIQUE,
  establishment_id UUID FK,
  customer_guid UUID,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  used_at TIMESTAMP
)
```

### Implementation Steps

1. **Project Setup**
   - Initialize SvelteKit: `npm create svelte@latest`
   - Install dependencies: `pg` (for local Postgres), `@vercel/postgres` (for production), `bcrypt`, `uuid`, `qrcode`
   - Configure `@sveltejs/adapter-vercel` for production, `@sveltejs/adapter-node` for dev
   - Set up project structure: `/routes`, `/lib/components`, `/lib/db`
   - Create `docker-compose.yml` with services:
     - `postgres`: Official Postgres image with volume for data persistence
     - `app`: Node.js container running SvelteKit dev server
   - Create `.env` for local config: `DATABASE_URL`, `PASSWORD_SALT`
   - Add `Dockerfile` for app container (Node.js base with npm install)

2. **Database & Utilities**
   - Create environment-aware database connection helper in `/lib/db/connection.ts`
     - Use `pg` for local development (reads `DATABASE_URL` from env)
     - Use `@vercel/postgres` for production (auto-configured on Vercel)
   - Create database migration script in `/scripts/migrate.js`
   - Build query functions for establishments and transactions
   - Add password hashing utilities (bcrypt)
   - Implement GUID generation and token creation functions
   - Add seed data script for local development testing

3. **API Routes** (in `/routes/api/`)
   - `POST /api/tokens/generate` — Generate new one-time transaction token for establishment
   - `POST /api/tokens/validate` — Validate token, mark as used, record customer GUID
   - `GET /api/establishments/[id]/config` — Fetch establishment name and grid size
   - `PUT /api/establishments/[id]/config` — Update establishment settings (auth required)
   - `GET /api/establishments/[id]/analytics` — Get stamp statistics (auth required)
   - `POST /api/establishments/auth` — Password verification for admin access

4. **Customer Stamp Page** (`/routes/stamp/[establishment_id]/+page.svelte`)
   - Parse establishment_id and token from URL query params
   - Load establishment config (name, grid_size) on mount
   - Generate/retrieve customer GUID from localStorage (keyed by establishment_id)
   - Validate token via API call, sending customer GUID
   - Display grid with filled/unfilled squares based on localStorage stamp count
   - Increment stamp count in localStorage after successful validation
   - Show establishment name as header

5. **Admin Dashboard** (`/routes/admin/[establishment_id]/+page.svelte`)
   - Password authentication form (stores session in sessionStorage)
   - Configuration editor: text input for name, number input for grid size
   - QR code generator:
     - Auto-generate new token on page load/refresh
     - Display QR code encoding: `{origin}/stamp/{establishment_id}?token={token}`
     - Refresh button to generate new QR code
   - Analytics display:
     - Total stamps issued count
     - List of customer GUIDs with stamp counts per customer
     - Recent transaction timestamps

6. **Establishment Onboarding**
   - Create CLI script or admin page at `/routes/setup/+page.svelte`
   - Form inputs: establishment name, password
   - Generate UUID for establishment_id
   - Hash password and insert into database
   - Display admin URL: `/admin/{establishment_id}`

7. **UI Components** (in `/lib/components/`)
   - `StampGrid.svelte` — Responsive grid with filled/empty square states
   - `QRDisplay.svelte` — QR code rendering and refresh controls
   - `AnalyticsTable.svelte` — Data table for stamp statistics
   - `PasswordForm.svelte` — Reusable auth form component

8. **Deployment**
   - **Local Development**:
     - Run `docker-compose up` to start Postgres + SvelteKit dev server
     - Access app at `http://localhost:5173`
     - Run migrations: `npm run migrate`
     - Seed test data: `npm run seed`
   - **Production**:
     - Set up Vercel Postgres database
     - Configure environment variables: `POSTGRES_URL`, `PASSWORD_SALT`
     - Add `vercel.json` with proper region config
     - Run migrations via Vercel CLI or seed script
     - Deploy via `vercel --prod`

### Key Features

**Customer Experience**:
- Scan QR → Land on stamp page → Automatically receive stamp
- View previous stamps on return visits
- No login required, anonymous via GUID
- Works across devices if localStorage is shared (same browser)

**Establishment Admin**:
- Password-protected dashboard per establishment
- Real-time QR code generation for transactions
- Configure stamp card size dynamically, default to 9 squares
- Customize establishment display name
- Track total stamps and per-customer usage

**Security**:
- One-time tokens prevent duplicate stamp claims
- Passwords hashed with bcrypt
- Establishment-scoped data isolation
- Token expiry possible (add `expires_at` column)

### Open Questions

1. **Customer GUID Scope**: Per-establishment (separate cards per business) or global (unified identity)?
2. **Stamp Book Completion**: Show celebration animation? Generate reward code? Alert establishment? Auto-reset?
3. **Establishment Registration**: Self-service signup page or admin-only provisioning?
4. **Token Expiry**: Should QR codes expire after X minutes/hours?
5. **Offline Support**: Should stamps queue when offline and sync later?
6. **Multi-device Sync**: How to handle customer with same GUID on different devices?
