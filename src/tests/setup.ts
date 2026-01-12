import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PASSWORD_SALT = 'test_salt';
process.env.NODE_ENV = 'test';

// Mock fetch globally
global.fetch = vi.fn();

// Mock crypto.randomUUID
if (typeof crypto === 'undefined') {
	global.crypto = {
		randomUUID: () => '00000000-0000-0000-0000-000000000000'
	} as any;
}
