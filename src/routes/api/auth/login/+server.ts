import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminUserByEmail, createSession } from '$lib/db/queries';
import { verifyPassword } from '$lib/utils/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password required' }, { status: 400 });
		}

		const user = await getAdminUserByEmail(email);

		if (!user) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		const isValid = await verifyPassword(password, user.password_hash);

		if (!isValid) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		const sessionId = crypto.randomUUID();
		await createSession(sessionId, user.id);

		cookies.set('session_id', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		return json({
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
				establishmentId: user.establishment_id
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Login failed' }, { status: 500 });
	}
};
