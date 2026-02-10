import type { Handle } from '@sveltejs/kit';
import { getSessionWithUser } from '$lib/db/queries';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session_id');

	if (sessionId) {
		event.locals.user = await getSessionWithUser(sessionId);
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
