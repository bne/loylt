import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateGuid, generateToken } from '$lib/utils/tokens';
import { hashPassword, verifyPassword } from '$lib/utils/auth';

describe('Token Utilities', () => {
	describe('generateGuid', () => {
		it('should generate a valid UUID', () => {
			const guid = generateGuid();
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(guid).toMatch(uuidRegex);
		});

		it('should generate unique GUIDs', () => {
			const guid1 = generateGuid();
			const guid2 = generateGuid();
			expect(guid1).not.toBe(guid2);
		});
	});

	describe('generateToken', () => {
		it('should generate a hex string', () => {
			const token = generateToken();
			const hexRegex = /^[0-9a-f]+$/i;
			expect(token).toMatch(hexRegex);
		});

		it('should generate 64 character token (32 bytes)', () => {
			const token = generateToken();
			expect(token).toHaveLength(64);
		});

		it('should generate unique tokens', () => {
			const token1 = generateToken();
			const token2 = generateToken();
			expect(token1).not.toBe(token2);
		});
	});
});

describe('Auth Utilities', () => {
	describe('hashPassword', () => {
		it('should hash a password', async () => {
			const password = 'testPassword123';
			const hash = await hashPassword(password);
			expect(hash).toBeDefined();
			expect(hash).not.toBe(password);
			expect(hash.startsWith('$2')).toBe(true); // bcrypt hash format
		});

		it('should generate different hashes for same password', async () => {
			const password = 'testPassword123';
			const hash1 = await hashPassword(password);
			const hash2 = await hashPassword(password);
			expect(hash1).not.toBe(hash2); // Due to salt
		});
	});

	describe('verifyPassword', () => {
		it('should verify correct password', async () => {
			const password = 'testPassword123';
			const hash = await hashPassword(password);
			const isValid = await verifyPassword(password, hash);
			expect(isValid).toBe(true);
		});

		it('should reject incorrect password', async () => {
			const password = 'testPassword123';
			const hash = await hashPassword(password);
			const isValid = await verifyPassword('wrongPassword', hash);
			expect(isValid).toBe(false);
		});

		it('should reject empty password', async () => {
			const password = 'testPassword123';
			const hash = await hashPassword(password);
			const isValid = await verifyPassword('', hash);
			expect(isValid).toBe(false);
		});
	});
});
