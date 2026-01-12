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
				password_hash: 'hash123',
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

			await queries.createEstablishment('id-123', 'Coffee Shop', 'hash456', 10);

			expect(query).toHaveBeenCalledWith(
				'INSERT INTO establishments (id, name, password_hash, grid_size) VALUES ($1, $2, $3, $4)',
				['id-123', 'Coffee Shop', 'hash456', 10]
			);
		});

		it('should use default grid size when not provided', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			await queries.createEstablishment('id-123', 'Coffee Shop', 'hash456');

			expect(query).toHaveBeenCalledWith(
				'INSERT INTO establishments (id, name, password_hash, grid_size) VALUES ($1, $2, $3, $4)',
				['id-123', 'Coffee Shop', 'hash456', 9]
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

	describe('validateAndUseToken', () => {
		it('should return valid true and mark token as used', async () => {
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
				.mockResolvedValueOnce([mockTransaction])
				.mockResolvedValueOnce([]);

			const result = await queries.validateAndUseToken('token123', 'customer-guid');

			expect(result).toEqual({ valid: true, establishmentId: 'est-456' });
			expect(query).toHaveBeenCalledTimes(2);
			expect(query).toHaveBeenNthCalledWith(
				2,
				'UPDATE transactions SET used = true, customer_guid = $1, used_at = NOW() WHERE id = $2',
				['customer-guid', 'trans-123']
			);
		});

		it('should return valid false when token not found', async () => {
			vi.mocked(query).mockResolvedValueOnce([]);

			const result = await queries.validateAndUseToken('invalid-token', 'customer-guid');

			expect(result).toEqual({ valid: false });
			expect(query).toHaveBeenCalledTimes(1);
		});

		it('should return valid false when token already used', async () => {
			const mockTransaction = {
				id: 'trans-123',
				token: 'token123',
				establishment_id: 'est-456',
				customer_guid: 'prev-customer',
				used: true,
				created_at: new Date(),
				used_at: new Date()
			};

			vi.mocked(query).mockResolvedValueOnce([]);

			const result = await queries.validateAndUseToken('token123', 'customer-guid');

			expect(result).toEqual({ valid: false });
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
