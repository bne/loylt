import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateGuid } from '$lib/utils/tokens';
import { hashPassword } from '$lib/utils/auth';
import { createEstablishment } from '$lib/db/queries';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { name, password } = await request.json();

		if (!name || !password) {
			return json({ error: 'Name and password required' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
		}

		const establishmentId = generateGuid();
		const passwordHash = await hashPassword(password);

		await createEstablishment(establishmentId, name, passwordHash);

		return json({ id: establishmentId });
	} catch (error) {
		console.error('Create establishment error:', error);
		return json({ error: 'Failed to create establishment' }, { status: 500 });
	}
};
