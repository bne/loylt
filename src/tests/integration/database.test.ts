import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://loylt:loylt_dev@localhost:5432/loylt_test';

// Check if database is available before running tests
const canConnect = async (): Promise<boolean> => {
	const testPool = new Pool({ connectionString: TEST_DATABASE_URL, connectionTimeoutMillis: 2000 });
	try {
		await testPool.query('SELECT 1');
		await testPool.end();
		return true;
	} catch {
		await testPool.end().catch(() => {});
		return false;
	}
};

// These tests require a running database
// Run with: TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/test_db npm test
describe.skipIf(!(await canConnect()))('Database Integration Tests', () => {
	let pool: Pool;

	beforeAll(async () => {
		pool = new Pool({ connectionString: TEST_DATABASE_URL });

		// Create test tables
		await pool.query(`
			CREATE TABLE IF NOT EXISTS establishments (
				id UUID PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				grid_size INTEGER DEFAULT 9,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`);

		await pool.query(`
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

		await pool.query(`
			CREATE TABLE IF NOT EXISTS token_redemptions (
				id UUID PRIMARY KEY,
				transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
				customer_guid UUID NOT NULL,
				redeemed_at TIMESTAMP DEFAULT NOW(),
				UNIQUE(transaction_id, customer_guid)
			)
		`);
	});

	afterAll(async () => {
		// Clean up test data
		await pool.query('DROP TABLE IF EXISTS token_redemptions CASCADE');
		await pool.query('DROP TABLE IF EXISTS transactions CASCADE');
		await pool.query('DROP TABLE IF EXISTS establishments CASCADE');
		await pool.end();
	});

	it('should create and retrieve establishment', async () => {
		const establishmentId = randomUUID();

		await pool.query(
			'INSERT INTO establishments (id, name, password_hash, grid_size) VALUES ($1, $2, $3, $4)',
			[establishmentId, 'Integration Test Shop', 'hash123', 9]
		);

		const result = await pool.query(
			'SELECT * FROM establishments WHERE id = $1',
			[establishmentId]
		);

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].name).toBe('Integration Test Shop');
		expect(result.rows[0].grid_size).toBe(9);
	});

	it('should create transaction and validate token', async () => {
		const establishmentId = randomUUID();
		const tokenId = randomUUID();
		const token = 'unique-token-' + Date.now();
		const customerGuid = randomUUID();

		// Create establishment first
		await pool.query(
			'INSERT INTO establishments (id, name, password_hash, grid_size) VALUES ($1, $2, $3, $4)',
			[establishmentId, 'Token Test Shop', 'hash456', 9]
		);

		// Create transaction
		await pool.query(
			'INSERT INTO transactions (id, token, establishment_id, used) VALUES ($1, $2, $3, false)',
			[tokenId, token, establishmentId]
		);

		// Validate token exists
		const result = await pool.query(
			'SELECT * FROM transactions WHERE token = $1',
			[token]
		);

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].establishment_id).toBe(establishmentId);

		// Check no existing redemption for this customer
		const existingRedemption = await pool.query(
			'SELECT * FROM token_redemptions WHERE transaction_id = $1 AND customer_guid = $2',
			[tokenId, customerGuid]
		);
		expect(existingRedemption.rows).toHaveLength(0);

		// Record redemption
		await pool.query(
			'INSERT INTO token_redemptions (id, transaction_id, customer_guid, redeemed_at) VALUES ($1, $2, $3, NOW())',
			[randomUUID(), tokenId, customerGuid]
		);

		// Verify redemption recorded
		const redemptionResult = await pool.query(
			'SELECT * FROM token_redemptions WHERE transaction_id = $1 AND customer_guid = $2',
			[tokenId, customerGuid]
		);
		expect(redemptionResult.rows).toHaveLength(1);
		expect(redemptionResult.rows[0].customer_guid).toBe(customerGuid);

		// A different customer should still be able to redeem the same token
		const customer2Guid = randomUUID();
		await pool.query(
			'INSERT INTO token_redemptions (id, transaction_id, customer_guid, redeemed_at) VALUES ($1, $2, $3, NOW())',
			[randomUUID(), tokenId, customer2Guid]
		);

		const allRedemptions = await pool.query(
			'SELECT * FROM token_redemptions WHERE transaction_id = $1',
			[tokenId]
		);
		expect(allRedemptions.rows).toHaveLength(2);

		// Same customer should not be able to redeem twice (unique constraint)
		await expect(
			pool.query(
				'INSERT INTO token_redemptions (id, transaction_id, customer_guid, redeemed_at) VALUES ($1, $2, $3, NOW())',
				[randomUUID(), tokenId, customerGuid]
			)
		).rejects.toThrow();
	});

	it('should calculate analytics correctly', async () => {
		const establishmentId = randomUUID();
		const customerGuid1 = randomUUID();
		const customerGuid2 = randomUUID();

		// Create establishment
		await pool.query(
			'INSERT INTO establishments (id, name, password_hash, grid_size) VALUES ($1, $2, $3, $4)',
			[establishmentId, 'Analytics Test Shop', 'hash789', 9]
		);

		// Create transactions and redemptions
		for (let i = 0; i < 5; i++) {
			const transId = randomUUID();
			await pool.query(
				'INSERT INTO transactions (id, token, establishment_id) VALUES ($1, $2, $3)',
				[transId, `token-${Date.now()}-a${i}`, establishmentId]
			);
			await pool.query(
				'INSERT INTO token_redemptions (id, transaction_id, customer_guid, redeemed_at) VALUES ($1, $2, $3, NOW())',
				[randomUUID(), transId, customerGuid1]
			);
		}

		for (let i = 0; i < 3; i++) {
			const transId = randomUUID();
			await pool.query(
				'INSERT INTO transactions (id, token, establishment_id) VALUES ($1, $2, $3)',
				[transId, `token-${Date.now()}-b${i}`, establishmentId]
			);
			await pool.query(
				'INSERT INTO token_redemptions (id, transaction_id, customer_guid, redeemed_at) VALUES ($1, $2, $3, NOW())',
				[randomUUID(), transId, customerGuid2]
			);
		}

		// Get total stamps via token_redemptions
		const totalResult = await pool.query(
			`SELECT COUNT(*) as count FROM token_redemptions r
			JOIN transactions t ON r.transaction_id = t.id
			WHERE t.establishment_id = $1`,
			[establishmentId]
		);

		expect(parseInt(totalResult.rows[0].count)).toBe(8);

		// Get per-customer stats
		const customerResult = await pool.query(
			`SELECT r.customer_guid, COUNT(*) as count
			FROM token_redemptions r
			JOIN transactions t ON r.transaction_id = t.id
			WHERE t.establishment_id = $1
			GROUP BY r.customer_guid
			ORDER BY count DESC`,
			[establishmentId]
		);

		expect(customerResult.rows).toHaveLength(2);
		expect(customerResult.rows[0].customer_guid).toBe(customerGuid1);
		expect(parseInt(customerResult.rows[0].count)).toBe(5);
		expect(customerResult.rows[1].customer_guid).toBe(customerGuid2);
		expect(parseInt(customerResult.rows[1].count)).toBe(3);
	});

	it('should enforce foreign key constraint', async () => {
		const nonExistentEstId = randomUUID();

		await expect(
			pool.query(
				'INSERT INTO transactions (id, token, establishment_id, used) VALUES ($1, $2, $3, false)',
				[randomUUID(), 'token-fk-test', nonExistentEstId]
			)
		).rejects.toThrow();
	});

	it('should enforce unique token constraint', async () => {
		const establishmentId = randomUUID();
		const duplicateToken = 'duplicate-token-' + Date.now();

		// Create establishment
		await pool.query(
			'INSERT INTO establishments (id, name, password_hash, grid_size) VALUES ($1, $2, $3, $4)',
			[establishmentId, 'Unique Test Shop', 'hash999', 9]
		);

		// Create first transaction
		await pool.query(
			'INSERT INTO transactions (id, token, establishment_id, used) VALUES ($1, $2, $3, false)',
			[randomUUID(), duplicateToken, establishmentId]
		);

		// Try to create duplicate
		await expect(
			pool.query(
				'INSERT INTO transactions (id, token, establishment_id, used) VALUES ($1, $2, $3, false)',
				[randomUUID(), duplicateToken, establishmentId]
			)
		).rejects.toThrow();
	});
});
