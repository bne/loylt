import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEstablishment, updateEstablishment } from '$lib/db/queries';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;

		if (user.role === 'establishment_admin' && user.establishment_id !== id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const establishment = await getEstablishment(id);
		if (!establishment) {
			return json({ error: 'Establishment not found' }, { status: 404 });
		}

		const { name, gridSize } = await request.json();
		await updateEstablishment(id, name, gridSize);

		return json({ success: true });
	} catch (error) {
		console.error('Update establishment error:', error);
		return json({ error: 'Failed to update establishment' }, { status: 500 });
	}
};
