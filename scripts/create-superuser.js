import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

function parseArgs() {
	const args = process.argv.slice(2);
	const result = {};
	for (let i = 0; i < args.length; i += 2) {
		const key = args[i]?.replace(/^--/, '');
		const value = args[i + 1];
		if (key && value) result[key] = value;
	}
	return result;
}

async function createSuperuser() {
	const { email, password } = parseArgs();

	if (!email || !password) {
		console.error('Usage: node scripts/create-superuser.js --email <email> --password <password>');
		process.exit(1);
	}

	if (password.length < 6) {
		console.error('Password must be at least 6 characters');
		process.exit(1);
	}

	let client;
	try {
		client = await pool.connect();
		// Check if email already exists
		const existing = await client.query('SELECT id FROM admin_users WHERE email = $1', [email]);
		if (existing.rows.length > 0) {
			console.error(`A user with email "${email}" already exists`);
			process.exit(1);
		}

		const userId = uuidv4();
		const passwordHash = await bcrypt.hash(password, 10);

		await client.query(
			'INSERT INTO admin_users (id, email, password_hash, role, establishment_id) VALUES ($1, $2, $3, $4, $5)',
			[userId, email, passwordHash, 'superuser', null]
		);

		console.log('Superuser created successfully');
		console.log(`  Email: ${email}`);
		console.log(`  Login at: http://localhost:5173/login`);
	} catch (error) {
		console.error('Failed to create superuser:', error.message);
		process.exit(1);
	} finally {
		if (client) client.release();
		await pool.end();
	}
}

createSuperuser();
