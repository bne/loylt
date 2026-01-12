import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEstablishmentAnalytics } from '$lib/db/queries';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'Establishment ID required' }, { status: 400 });
		}

		const analytics = await getEstablishmentAnalytics(id);

		return json(analytics);
	} catch (error) {
		console.error('Get analytics error:', error);
		return json({ error: 'Failed to fetch analytics' }, { status: 500 });
	}
};
