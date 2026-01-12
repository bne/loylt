import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn()
	}
}));

describe('API Route: Token Generation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should generate a token for valid establishment', async () => {
		const mockRequest = {
			json: vi.fn().mockResolvedValue({ establishmentId: 'est-123' })
		};

		// Import the handler
		const { POST } = await import('$routes/api/tokens/generate/+server');

		// Mock the database functions
		vi.mock('$lib/utils/tokens', () => ({
			generateToken: () => 'mock-token-123',
			generateGuid: () => 'mock-guid-123'
		}));

		vi.mock('$lib/db/queries', () => ({
			createTransaction: vi.fn().mockResolvedValue(undefined)
		}));

		const response = await POST({ request: mockRequest as any });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('token');
	});

	it('should return 400 when establishment ID missing', async () => {
		const mockRequest = {
			json: vi.fn().mockResolvedValue({})
		};

		const { POST } = await import('$routes/api/tokens/generate/+server');

		const response = await POST({ request: mockRequest as any });
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe('Establishment ID required');
	});
});

describe('API Route: Establishment Config', () => {
	it('should return establishment config', async () => {
		const mockEstablishment = {
			id: 'est-123',
			name: 'Test Shop',
			grid_size: 9
		};

		vi.mock('$lib/db/queries', () => ({
			getEstablishment: vi.fn().mockResolvedValue(mockEstablishment)
		}));

		const { GET } = await import('$routes/api/establishments/[id]/config/+server');

		const response = await GET({
			params: { id: 'est-123' }
		} as any);

		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual({
			id: 'est-123',
			name: 'Test Shop',
			gridSize: 9
		});
	});

	it('should return 404 when establishment not found', async () => {
		vi.mock('$lib/db/queries', () => ({
			getEstablishment: vi.fn().mockResolvedValue(null)
		}));

		const { GET } = await import('$routes/api/establishments/[id]/config/+server');

		const response = await GET({
			params: { id: 'nonexistent' }
		} as any);

		expect(response.status).toBe(404);
	});
});

describe('API Route: Authentication', () => {
	it('should authenticate with correct password', async () => {
		const mockEstablishment = {
			id: 'est-123',
			password_hash: 'hash123'
		};

		vi.mock('$lib/db/queries', () => ({
			getEstablishment: vi.fn().mockResolvedValue(mockEstablishment)
		}));

		vi.mock('$lib/utils/auth', () => ({
			verifyPassword: vi.fn().mockResolvedValue(true)
		}));

		const { POST } = await import('$routes/api/establishments/auth/+server');

		const mockRequest = {
			json: vi.fn().mockResolvedValue({
				establishmentId: 'est-123',
				password: 'correct-password'
			})
		};

		const response = await POST({ request: mockRequest as any });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should reject incorrect password', async () => {
		const mockEstablishment = {
			id: 'est-123',
			password_hash: 'hash123'
		};

		vi.mock('$lib/db/queries', () => ({
			getEstablishment: vi.fn().mockResolvedValue(mockEstablishment)
		}));

		vi.mock('$lib/utils/auth', () => ({
			verifyPassword: vi.fn().mockResolvedValue(false)
		}));

		const { POST } = await import('$routes/api/establishments/auth/+server');

		const mockRequest = {
			json: vi.fn().mockResolvedValue({
				establishmentId: 'est-123',
				password: 'wrong-password'
			})
		};

		const response = await POST({ request: mockRequest as any });

		expect(response.status).toBe(401);
	});
});

describe('API Route: Create Establishment', () => {
	it('should create establishment with valid data', async () => {
		vi.mock('$lib/utils/tokens', () => ({
			generateGuid: () => 'new-est-id'
		}));

		vi.mock('$lib/utils/auth', () => ({
			hashPassword: vi.fn().mockResolvedValue('hashed-password')
		}));

		vi.mock('$lib/db/queries', () => ({
			createEstablishment: vi.fn().mockResolvedValue(undefined)
		}));

		const { POST } = await import('$routes/api/establishments/create/+server');

		const mockRequest = {
			json: vi.fn().mockResolvedValue({
				name: 'New Coffee Shop',
				password: 'password123'
			})
		};

		const response = await POST({ request: mockRequest as any });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('id');
	});

	it('should reject password less than 6 characters', async () => {
		const { POST } = await import('$routes/api/establishments/create/+server');

		const mockRequest = {
			json: vi.fn().mockResolvedValue({
				name: 'New Coffee Shop',
				password: '12345'
			})
		};

		const response = await POST({ request: mockRequest as any });
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('at least 6 characters');
	});
});
