import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockQuery = vi.fn();
const mockRelease = vi.fn();
const mockConnect = vi.fn();
const mockEnd = vi.fn();
const mockHash = vi.fn().mockResolvedValue('hashed-password');

function flushPromises() {
	return new Promise(resolve => setTimeout(resolve, 50));
}

describe('create-superuser script', () => {
	const originalArgv = process.argv;
	let unhandledRejectionHandler: (reason: unknown) => void;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();

		mockConnect.mockResolvedValue({ query: mockQuery, release: mockRelease });

		// Default: queries return empty rows (safe fallback if execution continues past mocked exit)
		mockQuery.mockResolvedValue({ rows: [] });

		vi.doMock('pg', () => {
			return {
				Pool: function () {
					this.connect = mockConnect;
					this.end = mockEnd;
				}
			};
		});

		vi.doMock('bcrypt', () => ({
			default: { hash: mockHash },
			hash: mockHash
		}));

		vi.doMock('uuid', () => ({
			v4: vi.fn().mockReturnValue('mock-uuid-1234')
		}));

		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		// Mock process.exit as no-op — execution continues but we assert it was called
		vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

		// Suppress unhandled rejections from the floating createSuperuser() promise
		unhandledRejectionHandler = () => {};
		process.on('unhandledRejection', unhandledRejectionHandler);
	});

	afterEach(() => {
		process.argv = originalArgv;
		process.off('unhandledRejection', unhandledRejectionHandler);
		vi.restoreAllMocks();
	});

	async function runScript() {
		await import('../../scripts/create-superuser.js');
		await flushPromises();
	}

	it('should exit with error when email is missing', async () => {
		process.argv = ['node', 'create-superuser.js', '--password', 'test123'];

		await runScript();

		expect(process.exit).toHaveBeenCalledWith(1);
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('Usage:')
		);
	});

	it('should exit with error when password is missing', async () => {
		process.argv = ['node', 'create-superuser.js', '--email', 'admin@test.com'];

		await runScript();

		expect(process.exit).toHaveBeenCalledWith(1);
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('Usage:')
		);
	});

	it('should exit with error when no arguments provided', async () => {
		process.argv = ['node', 'create-superuser.js'];

		await runScript();

		expect(process.exit).toHaveBeenCalledWith(1);
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('Usage:')
		);
	});

	it('should exit with error when password is too short', async () => {
		process.argv = ['node', 'create-superuser.js', '--email', 'admin@test.com', '--password', '12345'];

		await runScript();

		expect(process.exit).toHaveBeenCalledWith(1);
		expect(console.error).toHaveBeenCalledWith('Password must be at least 6 characters');
	});

	it('should exit with error when email already exists', async () => {
		process.argv = ['node', 'create-superuser.js', '--email', 'existing@test.com', '--password', 'test123'];
		mockQuery
			.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] }) // email check - found
			.mockResolvedValue({ rows: [] }); // fallback for any continued execution

		await runScript();

		expect(process.exit).toHaveBeenCalledWith(1);
		expect(mockQuery).toHaveBeenCalledWith(
			'SELECT id FROM admin_users WHERE email = $1',
			['existing@test.com']
		);
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('already exists')
		);
		expect(mockRelease).toHaveBeenCalled();
		expect(mockEnd).toHaveBeenCalled();
	});

	it('should create superuser successfully', async () => {
		process.argv = ['node', 'create-superuser.js', '--email', 'admin@test.com', '--password', 'securepass'];
		mockQuery
			.mockResolvedValueOnce({ rows: [] })  // email check - not found
			.mockResolvedValueOnce({ rows: [] }); // INSERT

		await runScript();

		expect(process.exit).not.toHaveBeenCalled();
		expect(mockQuery).toHaveBeenCalledWith(
			'SELECT id FROM admin_users WHERE email = $1',
			['admin@test.com']
		);
		expect(mockQuery).toHaveBeenCalledWith(
			'INSERT INTO admin_users (id, email, password_hash, role, establishment_id) VALUES ($1, $2, $3, $4, $5)',
			['mock-uuid-1234', 'admin@test.com', 'hashed-password', 'superuser', null]
		);
		expect(console.log).toHaveBeenCalledWith('Superuser created successfully');
		expect(mockRelease).toHaveBeenCalled();
		expect(mockEnd).toHaveBeenCalled();
	});

	it('should handle database errors gracefully', async () => {
		process.argv = ['node', 'create-superuser.js', '--email', 'admin@test.com', '--password', 'securepass'];
		mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

		await runScript();

		expect(process.exit).toHaveBeenCalledWith(1);
		expect(console.error).toHaveBeenCalledWith(
			'Failed to create superuser:',
			'Connection refused'
		);
		expect(mockRelease).toHaveBeenCalled();
		expect(mockEnd).toHaveBeenCalled();
	});

	it('should hash password with bcrypt salt rounds of 10', async () => {
		process.argv = ['node', 'create-superuser.js', '--email', 'admin@test.com', '--password', 'securepass'];
		mockQuery
			.mockResolvedValueOnce({ rows: [] })
			.mockResolvedValueOnce({ rows: [] });

		await runScript();

		expect(mockHash).toHaveBeenCalledWith('securepass', 10);
	});

	it('should parse args in any order', async () => {
		process.argv = ['node', 'create-superuser.js', '--password', 'securepass', '--email', 'admin@test.com'];
		mockQuery
			.mockResolvedValueOnce({ rows: [] })
			.mockResolvedValueOnce({ rows: [] });

		await runScript();

		expect(mockQuery).toHaveBeenCalledWith(
			'INSERT INTO admin_users (id, email, password_hash, role, establishment_id) VALUES ($1, $2, $3, $4, $5)',
			['mock-uuid-1234', 'admin@test.com', 'hashed-password', 'superuser', null]
		);
	});
});
