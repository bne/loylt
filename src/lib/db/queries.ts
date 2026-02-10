import { query } from './connection';
import type { Establishment, TokenRedemption, Transaction } from './types';

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
): Promise<{ valid: boolean; establishmentId?: string; alreadyRedeemed?: boolean }> {
	// Find the transaction by token (no used-flag filter — tokens are reusable)
	const results = await query<Transaction>(
		'SELECT * FROM transactions WHERE token = $1',
		[token]
	);

	if (results.length === 0) {
		return { valid: false };
	}

	const transaction = results[0];

	// Check if this customer already redeemed this token
	const existing = await query<TokenRedemption>(
		'SELECT * FROM token_redemptions WHERE transaction_id = $1 AND customer_guid = $2',
		[transaction.id, customerGuid]
	);

	if (existing.length > 0) {
		return { valid: false, alreadyRedeemed: true };
	}

	// Record the redemption
	const redemptionId = crypto.randomUUID();
	await query(
		'INSERT INTO token_redemptions (id, transaction_id, customer_guid, redeemed_at) VALUES ($1, $2, $3, NOW())',
		[redemptionId, transaction.id, customerGuid]
	);

	return { valid: true, establishmentId: transaction.establishment_id };
}

export async function getEstablishmentAnalytics(establishmentId: string) {
	const totalStamps = await query<{ count: string }>(
		`SELECT COUNT(*) as count FROM token_redemptions r
		JOIN transactions t ON r.transaction_id = t.id
		WHERE t.establishment_id = $1`,
		[establishmentId]
	);

	const customerStats = await query<{ customer_guid: string; count: string }>(
		`SELECT r.customer_guid, COUNT(*) as count
		FROM token_redemptions r
		JOIN transactions t ON r.transaction_id = t.id
		WHERE t.establishment_id = $1
		GROUP BY r.customer_guid
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
