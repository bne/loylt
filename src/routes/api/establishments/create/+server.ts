import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateGuid } from '$lib/utils/tokens';
import { hashPassword } from '$lib/utils/auth';
import { createEstablishment, createAdminUser, createSession, getAdminUserByEmail } from '$lib/db/queries';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { name, email, password } = await request.json();

		if (!name || !email || !password) {
			return json({ error: 'Name, email, and password required' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
		}

		const existing = await getAdminUserByEmail(email);
		if (existing) {
			return json({ error: 'A user with this email already exists' }, { status: 409 });
		}

		const establishmentId = generateGuid();
		const userId = generateGuid();
		const passwordHash = await hashPassword(password);

		await createEstablishment(establishmentId, name);
		await createAdminUser(userId, email, passwordHash, 'establishment_admin', establishmentId);

		// Auto-login: create session and set cookie
		const sessionId = crypto.randomUUID();
		await createSession(sessionId, userId);

		cookies.set('session_id', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 24 * 7
		});

		return json({ id: establishmentId });
	} catch (error) {
		console.error('Create establishment error:', error);
		return json({ error: 'Failed to create establishment' }, { status: 500 });
	}
};
