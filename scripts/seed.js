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

		await client.query(
			'INSERT INTO establishments (id, name, grid_size) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
			[establishmentId, 'Test Coffee Shop', 9]
		);

		// Create an admin user for the test establishment
		const adminId = uuidv4();
		const passwordHash = await bcrypt.hash('test123', 10);

		await client.query(
			'INSERT INTO admin_users (id, email, password_hash, role, establishment_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
			[adminId, 'admin@test.com', passwordHash, 'establishment_admin', establishmentId]
		);

		console.log('Database seeded successfully');
		console.log(`\nTest Establishment:`);
		console.log(`   ID: ${establishmentId}`);
		console.log(`   Name: Test Coffee Shop`);
		console.log(`\nTest Admin User:`);
		console.log(`   Email: admin@test.com`);
		console.log(`   Password: test123`);
		console.log(`   Login: http://localhost:5173/login`);
		console.log(`   Admin URL: http://localhost:5173/admin/${establishmentId}`);
	} catch (error) {
		console.error('Seed failed:', error);
		throw error;
	} finally {
		client.release();
		await pool.end();
	}
}

seed();
