import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getEstablishment, getAdminsByEstablishment } from '$lib/db/queries';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	const { establishment_id } = params;

	if (user.role === 'establishment_admin' && user.establishmentId !== establishment_id) {
		throw error(403, 'You do not have access to this establishment');
	}

	const establishment = await getEstablishment(establishment_id);
	if (!establishment) {
		throw error(404, 'Establishment not found');
	}

	const admins = await getAdminsByEstablishment(establishment_id);

	return {
		establishment: {
			id: establishment.id,
			name: establishment.name,
			gridSize: establishment.grid_size
		},
		admins: admins.map(a => ({
			id: a.id,
			email: a.email,
			role: a.role,
			createdAt: a.created_at
		}))
	};
};
