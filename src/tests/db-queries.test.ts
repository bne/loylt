import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as queries from '$lib/db/queries';

// Mock the connection module
vi.mock('$lib/db/connection', () => ({
	query: vi.fn()
}));

import { query } from '$lib/db/connection';

describe('Database Queries', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getEstablishment', () => {
		it('should return establishment when found', async () => {
			const mockEstablishment = {
				id: 'test-id',
				name: 'Test Shop',
				grid_size: 9,
				created_at: new Date()
			};

			vi.mocked(query).mockResolvedValueOnce([mockEstablishment]);

			const result = await queries.getEstablishment('test-id');

			expect(result).toEqual(mockEstablishment);
			expect(query).toHaveBeenCalledWith(
				'SELECT * FROM establishments WHERE id = $1',
				['test-id']
			);
		});

		it('should return null when establishment not found', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			const result = await queries.getEstablishment('nonexistent-id');

			expect(result).toBeNull();
		});
	});

	describe('createEstablishment', () => {
		it('should insert establishment with correct parameters', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			await queries.createEstablishment('id-123', 'Coffee Shop', 10);

			expect(query).toHaveBeenCalledWith(
				'INSERT INTO establishments (id, name, grid_size) VALUES ($1, $2, $3)',
				['id-123', 'Coffee Shop', 10]
			);
		});

		it('should use default grid size when not provided', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			await queries.createEstablishment('id-123', 'Coffee Shop');

			expect(query).toHaveBeenCalledWith(
				'INSERT INTO establishments (id, name, grid_size) VALUES ($1, $2, $3)',
				['id-123', 'Coffee Shop', 9]
			);
		});
	});

	describe('updateEstablishment', () => {
		it('should update name only', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			await queries.updateEstablishment('id-123', 'New Name', undefined);

			expect(query).toHaveBeenCalledWith(
				'UPDATE establishments SET name = $1 WHERE id = $2',
				['New Name', 'id-123']
			);
		});

		it('should update grid size only', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			await queries.updateEstablishment('id-123', undefined, 12);

			expect(query).toHaveBeenCalledWith(
				'UPDATE establishments SET grid_size = $1 WHERE id = $2',
				[12, 'id-123']
			);
		});

		it('should update both name and grid size', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			await queries.updateEstablishment('id-123', 'New Name', 12);

			expect(query).toHaveBeenCalledWith(
				'UPDATE establishments SET name = $1, grid_size = $2 WHERE id = $3',
				['New Name', 12, 'id-123']
			);
		});

		it('should not query when no updates provided', async () => {
			await queries.updateEstablishment('id-123', undefined, undefined);

			expect(query).not.toHaveBeenCalled();
		});
	});

	describe('createAdminUser', () => {
		it('should insert admin user with correct parameters', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			await queries.createAdminUser('user-123', 'admin@test.com', 'hash456', 'establishment_admin', 'est-789');

			expect(query).toHaveBeenCalledWith(
				'INSERT INTO admin_users (id, email, password_hash, role, establishment_id) VALUES ($1, $2, $3, $4, $5)',
				['user-123', 'admin@test.com', 'hash456', 'establishment_admin', 'est-789']
			);
		});

		it('should allow null establishment_id for superusers', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			await queries.createAdminUser('user-456', 'super@test.com', 'hash789', 'superuser', null);

			expect(query).toHaveBeenCalledWith(
				'INSERT INTO admin_users (id, email, password_hash, role, establishment_id) VALUES ($1, $2, $3, $4, $5)',
				['user-456', 'super@test.com', 'hash789', 'superuser', null]
			);
		});
	});

	describe('getAdminUserByEmail', () => {
		it('should return user when found', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'admin@test.com',
				password_hash: 'hash456',
				role: 'establishment_admin',
				establishment_id: 'est-789',
				created_at: new Date()
			};
			vi.mocked(query).mockResolvedValueOnce([mockUser]);

			const result = await queries.getAdminUserByEmail('admin@test.com');

			expect(result).toEqual(mockUser);
		});

		it('should return null when not found', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			const result = await queries.getAdminUserByEmail('nonexistent@test.com');

			expect(result).toBeNull();
		});
	});

	describe('createTransaction', () => {
		it('should insert transaction with correct parameters', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			await queries.createTransaction('trans-123', 'token456', 'est-789');

			expect(query).toHaveBeenCalledWith(
				'INSERT INTO transactions (id, token, establishment_id, used, created_at) VALUES ($1, $2, $3, false, NOW())',
				['trans-123', 'token456', 'est-789']
			);
		});
	});

	describe('validateAndUseToken', () => {
		it('should return valid true and insert redemption for new customer', async () => {
			const mockTransaction = {
				id: 'trans-123',
				token: 'token123',
				establishment_id: 'est-456',
				customer_guid: null,
				used: false,
				created_at: new Date(),
				used_at: null
			};

			vi.mocked(query)
				.mockResolvedValueOnce([mockTransaction]) // SELECT transaction
				.mockResolvedValueOnce([])                // SELECT existing redemption (none)
				.mockResolvedValueOnce([]);               // INSERT redemption

			const result = await queries.validateAndUseToken('token123', 'customer-guid');

			expect(result).toEqual({ valid: true, establishmentId: 'est-456' });
			expect(query).toHaveBeenCalledTimes(3);
			expect(query).toHaveBeenNthCalledWith(
				1,
				'SELECT * FROM transactions WHERE token = $1',
				['token123']
			);
			expect(query).toHaveBeenNthCalledWith(
				2,
				'SELECT * FROM token_redemptions WHERE transaction_id = $1 AND customer_guid = $2',
				['trans-123', 'customer-guid']
			);
			expect(query).toHaveBeenNthCalledWith(
				3,
				'INSERT INTO token_redemptions (id, transaction_id, customer_guid, redeemed_at) VALUES ($1, $2, $3, NOW())',
				[expect.any(String), 'trans-123', 'customer-guid']
			);
		});

		it('should return valid false when token not found', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			const result = await queries.validateAndUseToken('invalid-token', 'customer-guid');

			expect(result).toEqual({ valid: false });
			expect(query).toHaveBeenCalledTimes(1);
		});

		it('should return valid false with alreadyRedeemed when same customer reuses token', async () => {
			const mockTransaction = {
				id: 'trans-123',
				token: 'token123',
				establishment_id: 'est-456',
				customer_guid: null,
				used: false,
				created_at: new Date(),
				used_at: null
			};

			const mockRedemption = {
				id: 'redemption-1',
				transaction_id: 'trans-123',
				customer_guid: 'customer-guid',
				redeemed_at: new Date()
			};

			vi.mocked(query)
				.mockResolvedValueOnce([mockTransaction]) // SELECT transaction
				.mockResolvedValueOnce([mockRedemption]); // SELECT existing redemption (found)

			const result = await queries.validateAndUseToken('token123', 'customer-guid');

			expect(result).toEqual({ valid: false, alreadyRedeemed: true });
			expect(query).toHaveBeenCalledTimes(2);
		});

		it('should allow different customers to use the same token', async () => {
			const mockTransaction = {
				id: 'trans-123',
				token: 'token123',
				establishment_id: 'est-456',
				customer_guid: null,
				used: false,
				created_at: new Date(),
				used_at: null
			};

			vi.mocked(query)
				.mockResolvedValueOnce([mockTransaction]) // SELECT transaction
				.mockResolvedValueOnce([])                // SELECT existing redemption (none for customer-2)
				.mockResolvedValueOnce([]);               // INSERT redemption

			const result = await queries.validateAndUseToken('token123', 'customer-2');

			expect(result).toEqual({ valid: true, establishmentId: 'est-456' });
		});
	});

	describe('getEstablishmentAnalytics', () => {
		it('should return total stamps and customer breakdown', async () => {
			const mockTotalStamps = [{ count: '15' }];
			const mockCustomerStats = [
				{ customer_guid: 'customer-1', count: '8' },
				{ customer_guid: 'customer-2', count: '7' }
			];

			vi.mocked(query)
				.mockResolvedValueOnce(mockTotalStamps)
				.mockResolvedValueOnce(mockCustomerStats);

			const result = await queries.getEstablishmentAnalytics('est-123');

			expect(result).toEqual({
				totalStamps: 15,
				customers: [
					{ guid: 'customer-1', stampCount: 8 },
					{ guid: 'customer-2', stampCount: 7 }
				]
			});
			expect(query).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('token_redemptions'),
				['est-123']
			);
			expect(query).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('token_redemptions'),
				['est-123']
			);
		});

		it('should handle zero stamps', async () => {
			vi.mocked(query)
				.mockResolvedValueOnce([{ count: '0' }])
				.mockResolvedValueOnce([]);

			const result = await queries.getEstablishmentAnalytics('est-123');

			expect(result).toEqual({
				totalStamps: 0,
				customers: []
			});
		});

		it('should handle missing count', async () => {
			vi.mocked(query)
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			const result = await queries.getEstablishmentAnalytics('est-123');

			expect(result).toEqual({
				totalStamps: 0,
				customers: []
			});
		});
	});
});
