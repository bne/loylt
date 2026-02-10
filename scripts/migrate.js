import { Pool } from 'pg';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

async function migrate() {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// Create establishments table
		await client.query(`
			CREATE TABLE IF NOT EXISTS establishments (
				id UUID PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				grid_size INTEGER DEFAULT 9,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`);

		// Drop password_hash from establishments if it exists (moved to admin_users)
		await client.query(`
			ALTER TABLE establishments DROP COLUMN IF EXISTS password_hash
		`);

		// Add reward configuration columns
		await client.query(`
			ALTER TABLE establishments ADD COLUMN IF NOT EXISTS reward_text TEXT
		`);
		await client.query(`
			ALTER TABLE establishments ADD COLUMN IF NOT EXISTS reward_image_url TEXT
		`);

		// Create transactions table
		await client.query(`
			CREATE TABLE IF NOT EXISTS transactions (
				id UUID PRIMARY KEY,
				token VARCHAR(255) UNIQUE NOT NULL,
				establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
				customer_guid UUID,
				used BOOLEAN DEFAULT false,
				created_at TIMESTAMP DEFAULT NOW(),
				used_at TIMESTAMP
			)
		`);

		// Create token_redemptions table (tracks per-customer redemptions)
		await client.query(`
			CREATE TABLE IF NOT EXISTS token_redemptions (
				id UUID PRIMARY KEY,
				transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
				customer_guid UUID NOT NULL,
				redeemed_at TIMESTAMP DEFAULT NOW(),
				UNIQUE(transaction_id, customer_guid)
			)
		`);

		// Create admin_users table
		await client.query(`
			CREATE TABLE IF NOT EXISTS admin_users (
				id UUID PRIMARY KEY,
				email VARCHAR(255) UNIQUE NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				role VARCHAR(50) NOT NULL CHECK (role IN ('establishment_admin', 'superuser')),
				establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`);

		// Create sessions table
		await client.query(`
			CREATE TABLE IF NOT EXISTS sessions (
				id UUID PRIMARY KEY,
				user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
				expires_at TIMESTAMP NOT NULL,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`);

		// Create indexes
		await client.query(`
			CREATE INDEX IF NOT EXISTS idx_transactions_token ON transactions(token)
		`);
		await client.query(`
			CREATE INDEX IF NOT EXISTS idx_transactions_establishment ON transactions(establishment_id)
		`);
		await client.query(`
			CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_guid)
		`);
		await client.query(`
			CREATE INDEX IF NOT EXISTS idx_token_redemptions_transaction ON token_redemptions(transaction_id)
		`);
		await client.query(`
			CREATE INDEX IF NOT EXISTS idx_token_redemptions_customer ON token_redemptions(customer_guid)
		`);
		await client.query(`
			CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)
		`);
		await client.query(`
			CREATE INDEX IF NOT EXISTS idx_admin_users_establishment ON admin_users(establishment_id)
		`);
		await client.query(`
			CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)
		`);

		await client.query('COMMIT');
		console.log('✅ Database migration completed successfully');
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('❌ Migration failed:', error);
		throw error;
	} finally {
		client.release();
		await pool.end();
	}
}

migrate();
