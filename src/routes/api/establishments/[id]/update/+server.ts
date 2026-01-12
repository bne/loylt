import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEstablishment, updateEstablishment } from '$lib/db/queries';
import { verifyPassword } from '$lib/utils/auth';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const { password, name, gridSize } = await request.json();

		if (!id || !password) {
			return json({ error: 'Establishment ID and password required' }, { status: 400 });
		}

		const establishment = await getEstablishment(id);

		if (!establishment) {
			return json({ error: 'Establishment not found' }, { status: 404 });
		}

		const isValid = await verifyPassword(password, establishment.password_hash);

		if (!isValid) {
			return json({ error: 'Invalid password' }, { status: 401 });
		}

		await updateEstablishment(id, name, gridSize);

		return json({ success: true });
	} catch (error) {
		console.error('Update establishment error:', error);
		return json({ error: 'Failed to update establishment' }, { status: 500 });
	}
};
