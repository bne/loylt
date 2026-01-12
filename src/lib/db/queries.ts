import { query } from './connection';
import type { Establishment, Transaction } from './types';

export async function getEstablishment(id: string): Promise<Establishment | null> {
	const results = await query<Establishment>(
		'SELECT * FROM establishments WHERE id = $1',
		[id]
	);
	return results[0] || null;
}

export async function updateEstablishment(
	id: string,
	name?: string,
	gridSize?: number
): Promise<void> {
	const updates: string[] = [];
	const values: any[] = [];
	let paramIndex = 1;

	if (name !== undefined) {
		updates.push(`name = $${paramIndex++}`);
		values.push(name);
	}
	if (gridSize !== undefined) {
		updates.push(`grid_size = $${paramIndex++}`);
		values.push(gridSize);
	}

	if (updates.length > 0) {
		values.push(id);
		await query(
			`UPDATE establishments SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
			values
		);
	}
}

export async function createEstablishment(
	id: string,
	name: string,
	passwordHash: string,
	gridSize: number = 9
): Promise<void> {
	await query(
		'INSERT INTO establishments (id, name, password_hash, grid_size) VALUES ($1, $2, $3, $4)',
		[id, name, passwordHash, gridSize]
	);
}

export async function verifyEstablishmentPassword(
	id: string,
	passwordHash: string
): Promise<boolean> {
	const results = await query<{ password_hash: string }>(
		'SELECT password_hash FROM establishments WHERE id = $1',
		[id]
	);
	return results.length > 0 && results[0].password_hash === passwordHash;
}

export async function createTransaction(
	id: string,
	token: string,
	establishmentId: string
): Promise<void> {
	await query(
		'INSERT INTO transactions (id, token, establishment_id, used, created_at) VALUES ($1, $2, $3, false, NOW())',
		[id, token, establishmentId]
	);
}

export async function validateAndUseToken(
	token: string,
	customerGuid: string
): Promise<{ valid: boolean; establishmentId?: string }> {
	const results = await query<Transaction>(
		'SELECT * FROM transactions WHERE token = $1 AND used = false',
		[token]
	);

	if (results.length === 0) {
		return { valid: false };
	}

	const transaction = results[0];

	await query(
		'UPDATE transactions SET used = true, customer_guid = $1, used_at = NOW() WHERE id = $2',
		[customerGuid, transaction.id]
	);

	return { valid: true, establishmentId: transaction.establishment_id };
}

export async function getEstablishmentAnalytics(establishmentId: string) {
	const totalStamps = await query<{ count: string }>(
		'SELECT COUNT(*) as count FROM transactions WHERE establishment_id = $1 AND used = true',
		[establishmentId]
	);

	const customerStats = await query<{ customer_guid: string; count: string }>(
		`SELECT customer_guid, COUNT(*) as count
		FROM transactions
		WHERE establishment_id = $1 AND used = true AND customer_guid IS NOT NULL
		GROUP BY customer_guid
		ORDER BY count DESC`,
		[establishmentId]
	);

	return {
		totalStamps: parseInt(totalStamps[0]?.count || '0'),
		customers: customerStats.map(c => ({
			guid: c.customer_guid,
			stampCount: parseInt(c.count)
		}))
	};
}
