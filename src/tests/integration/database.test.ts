import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

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
	});

	afterAll(async () => {
		// Clean up test data
		await pool.query('DROP TABLE IF EXISTS transactions CASCADE');
		await pool.query('DROP TABLE IF EXISTS establishments CASCADE');
		await pool.end();
	});

	it('should create and retrieve establishment', async () => {
		const establishmentId = 'test-est-' + Date.now();

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
		const establishmentId = 'test-est-' + Date.now();
		const tokenId = 'test-token-' + Date.now();
		const token = 'unique-token-' + Date.now();

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

		// Validate token
		const result = await pool.query(
			'SELECT * FROM transactions WHERE token = $1 AND used = false',
			[token]
		);

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].establishment_id).toBe(establishmentId);
		expect(result.rows[0].used).toBe(false);

		// Mark as used
		await pool.query(
			'UPDATE transactions SET used = true, customer_guid = $1, used_at = NOW() WHERE id = $2',
			['customer-guid-123', tokenId]
		);

		// Verify it's marked as used
		const usedResult = await pool.query(
			'SELECT * FROM transactions WHERE token = $1',
			[token]
		);

		expect(usedResult.rows[0].used).toBe(true);
		expect(usedResult.rows[0].customer_guid).toBe('customer-guid-123');
	});

	it('should calculate analytics correctly', async () => {
		const establishmentId = 'test-est-analytics-' + Date.now();
		const customerGuid1 = 'customer-1';
		const customerGuid2 = 'customer-2';

		// Create establishment
		await pool.query(
			'INSERT INTO establishments (id, name, password_hash, grid_size) VALUES ($1, $2, $3, $4)',
			[establishmentId, 'Analytics Test Shop', 'hash789', 9]
		);

		// Create transactions
		for (let i = 0; i < 5; i++) {
			await pool.query(
				'INSERT INTO transactions (id, token, establishment_id, customer_guid, used) VALUES ($1, $2, $3, $4, true)',
				[`trans-${i}`, `token-${i}`, establishmentId, customerGuid1]
			);
		}

		for (let i = 5; i < 8; i++) {
			await pool.query(
				'INSERT INTO transactions (id, token, establishment_id, customer_guid, used) VALUES ($1, $2, $3, $4, true)',
				[`trans-${i}`, `token-${i}`, establishmentId, customerGuid2]
			);
		}

		// Get total stamps
		const totalResult = await pool.query(
			'SELECT COUNT(*) as count FROM transactions WHERE establishment_id = $1 AND used = true',
			[establishmentId]
		);

		expect(parseInt(totalResult.rows[0].count)).toBe(8);

		// Get per-customer stats
		const customerResult = await pool.query(
			`SELECT customer_guid, COUNT(*) as count
			FROM transactions
			WHERE establishment_id = $1 AND used = true AND customer_guid IS NOT NULL
			GROUP BY customer_guid
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
		const nonExistentEstId = 'non-existent-id';

		await expect(
			pool.query(
				'INSERT INTO transactions (id, token, establishment_id, used) VALUES ($1, $2, $3, false)',
				['trans-fk-test', 'token-fk-test', nonExistentEstId]
			)
		).rejects.toThrow();
	});

	it('should enforce unique token constraint', async () => {
		const establishmentId = 'test-est-unique-' + Date.now();
		const duplicateToken = 'duplicate-token-' + Date.now();

		// Create establishment
		await pool.query(
			'INSERT INTO establishments (id, name, password_hash, grid_size) VALUES ($1, $2, $3, $4)',
			[establishmentId, 'Unique Test Shop', 'hash999', 9]
		);

		// Create first transaction
		await pool.query(
			'INSERT INTO transactions (id, token, establishment_id, used) VALUES ($1, $2, $3, false)',
			['trans-unique-1', duplicateToken, establishmentId]
		);

		// Try to create duplicate
		await expect(
			pool.query(
				'INSERT INTO transactions (id, token, establishment_id, used) VALUES ($1, $2, $3, false)',
				['trans-unique-2', duplicateToken, establishmentId]
			)
		).rejects.toThrow();
	});
});
