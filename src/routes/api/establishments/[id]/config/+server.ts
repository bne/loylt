import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEstablishment } from '$lib/db/queries';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'Establishment ID required' }, { status: 400 });
		}

		const establishment = await getEstablishment(id);

		if (!establishment) {
			return json({ error: 'Establishment not found' }, { status: 404 });
		}

		return json({
			id: establishment.id,
			name: establishment.name,
			gridSize: establishment.grid_size,
			rewardText: establishment.reward_text,
			rewardImageUrl: establishment.reward_image_url,
			logoUrl: establishment.logo_url
		});
	} catch (error) {
		console.error('Get establishment error:', error);
		return json({ error: 'Failed to fetch establishment' }, { status: 500 });
	}
};
