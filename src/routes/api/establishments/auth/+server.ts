import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEstablishment } from '$lib/db/queries';
import { verifyPassword } from '$lib/utils/auth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { establishmentId, password } = await request.json();

		if (!establishmentId || !password) {
			return json({ error: 'Establishment ID and password required' }, { status: 400 });
		}

		const establishment = await getEstablishment(establishmentId);

		if (!establishment) {
			return json({ error: 'Establishment not found' }, { status: 404 });
		}

		const isValid = await verifyPassword(password, establishment.password_hash);

		if (!isValid) {
			return json({ error: 'Invalid password' }, { status: 401 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Auth error:', error);
		return json({ error: 'Authentication failed' }, { status: 500 });
	}
};
