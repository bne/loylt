import { query } from './connection';
import type { AdminRole, AdminUser, Establishment, Session, TokenRedemption, Transaction } from './types';

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
	gridSize?: number,
	rewardText?: string | null,
	rewardImageUrl?: string | null,
	logoUrl?: string | null
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
	if (rewardText !== undefined) {
		updates.push(`reward_text = $${paramIndex++}`);
		values.push(rewardText);
	}
	if (rewardImageUrl !== undefined) {
		updates.push(`reward_image_url = $${paramIndex++}`);
		values.push(rewardImageUrl);
	}
	if (logoUrl !== undefined) {
		updates.push(`logo_url = $${paramIndex++}`);
		values.push(logoUrl);
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
	gridSize: number = 9
): Promise<void> {
	await query(
		'INSERT INTO establishments (id, name, grid_size) VALUES ($1, $2, $3)',
		[id, name, gridSize]
	);
}

export async function getAllEstablishments(): Promise<Establishment[]> {
	return query<Establishment>(
		'SELECT * FROM establishments ORDER BY created_at DESC'
	);
}

// --- Admin User queries ---

export async function createAdminUser(
	id: string,
	email: string,
	passwordHash: string,
	role: AdminRole,
	establishmentId: string | null
): Promise<void> {
	await query(
		'INSERT INTO admin_users (id, email, password_hash, role, establishment_id) VALUES ($1, $2, $3, $4, $5)',
		[id, email, passwordHash, role, establishmentId]
	);
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
	const results = await query<AdminUser>(
		'SELECT * FROM admin_users WHERE email = $1',
		[email]
	);
	return results[0] || null;
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
	const results = await query<AdminUser>(
		'SELECT * FROM admin_users WHERE id = $1',
		[id]
	);
	return results[0] || null;
}

export async function getAdminsByEstablishment(establishmentId: string): Promise<AdminUser[]> {
	return query<AdminUser>(
		'SELECT * FROM admin_users WHERE establishment_id = $1 ORDER BY created_at ASC',
		[establishmentId]
	);
}

export async function deleteAdminUser(id: string): Promise<void> {
	await query('DELETE FROM admin_users WHERE id = $1', [id]);
}

// --- Session queries ---

const SESSION_DURATION_HOURS = 24 * 7; // 7 days

export async function createSession(id: string, userId: string): Promise<Session> {
	const results = await query<Session>(
		`INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '${SESSION_DURATION_HOURS} hours') RETURNING *`,
		[id, userId]
	);
	return results[0];
}

export async function getSessionWithUser(sessionId: string): Promise<AdminUser | null> {
	const results = await query<AdminUser>(
		`SELECT u.* FROM admin_users u
		JOIN sessions s ON s.user_id = u.id
		WHERE s.id = $1 AND s.expires_at > NOW()`,
		[sessionId]
	);
	return results[0] || null;
}

export async function deleteSession(sessionId: string): Promise<void> {
	await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
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
