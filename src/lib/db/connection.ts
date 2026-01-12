import { Pool } from 'pg';
import { sql as vercelSql } from '@vercel/postgres';

const isDev = process.env.NODE_ENV !== 'production';

// For local development with pg
let pool: Pool | null = null;

if (isDev && process.env.DATABASE_URL) {
	pool = new Pool({
		connectionString: process.env.DATABASE_URL
	});
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
	if (isDev && pool) {
		const result = await pool.query(text, params);
		return result.rows;
	} else {
		// Production: use Vercel Postgres
		const result = await vercelSql.query(text, params);
		return result.rows as T[];
	}
}

export async function getClient() {
	if (isDev && pool) {
		return pool.connect();
	}
	throw new Error('Client connections only available in development');
}
