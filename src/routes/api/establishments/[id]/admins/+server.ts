import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminsByEstablishment, getAdminUserByEmail, createAdminUser } from '$lib/db/queries';
import { hashPassword } from '$lib/utils/auth';

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	if (user.role === 'establishment_admin' && user.establishment_id !== id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const admins = await getAdminsByEstablishment(id);
	return json(admins.map(a => ({
		id: a.id,
		email: a.email,
		role: a.role,
		createdAt: a.created_at
	})));
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	if (user.role === 'establishment_admin' && user.establishment_id !== id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password required' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
		}

		const existing = await getAdminUserByEmail(email);
		if (existing) {
			return json({ error: 'A user with this email already exists' }, { status: 409 });
		}

		const userId = crypto.randomUUID();
		const passwordHash = await hashPassword(password);
		await createAdminUser(userId, email, passwordHash, 'establishment_admin', id);

		return json({ id: userId, email }, { status: 201 });
	} catch (error) {
		console.error('Create admin error:', error);
		return json({ error: 'Failed to create admin' }, { status: 500 });
	}
};
