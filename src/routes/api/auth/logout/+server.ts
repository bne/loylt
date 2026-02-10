import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSession } from '$lib/db/queries';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('session_id');

	if (sessionId) {
		await deleteSession(sessionId);
		cookies.delete('session_id', { path: '/' });
	}

	return json({ success: true });
};
