import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

async function seed() {
	const client = await pool.connect();
	try {
		// Create a test establishment
		const establishmentId = uuidv4();
		const passwordHash = await bcrypt.hash('test123', 10);

		await client.query(
			'INSERT INTO establishments (id, name, password_hash, grid_size) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
			[establishmentId, 'Test Coffee Shop', passwordHash, 9]
		);

		console.log('✅ Database seeded successfully');
		console.log(`\n🏪 Test Establishment:`);
		console.log(`   ID: ${establishmentId}`);
		console.log(`   Name: Test Coffee Shop`);
		console.log(`   Password: test123`);
		console.log(`   Admin URL: http://localhost:5173/admin/${establishmentId}`);
	} catch (error) {
		console.error('❌ Seed failed:', error);
		throw error;
	} finally {
		client.release();
		await pool.end();
	}
}

seed();
