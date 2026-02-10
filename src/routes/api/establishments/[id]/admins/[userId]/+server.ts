import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminUserById, deleteAdminUser } from '$lib/db/queries';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id, userId } = params;

	if (user.role === 'establishment_admin' && user.establishment_id !== id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	if (userId === user.id) {
		return json({ error: 'Cannot remove yourself' }, { status: 400 });
	}

	const targetUser = await getAdminUserById(userId);
	if (!targetUser || targetUser.establishment_id !== id) {
		return json({ error: 'Admin not found' }, { status: 404 });
	}

	await deleteAdminUser(userId);
	return json({ success: true });
};
