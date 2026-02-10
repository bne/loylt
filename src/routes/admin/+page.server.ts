import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAllEstablishments } from '$lib/db/queries';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (user.role === 'establishment_admin') {
		throw redirect(302, `/admin/${user.establishmentId}`);
	}

	const establishments = await getAllEstablishments();

	return { establishments };
};
