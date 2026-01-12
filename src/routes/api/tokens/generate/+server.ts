import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateToken, generateGuid } from '$lib/utils/tokens';
import { createTransaction } from '$lib/db/queries';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { establishmentId } = await request.json();

		if (!establishmentId) {
			return json({ error: 'Establishment ID required' }, { status: 400 });
		}

		const token = generateToken();
		const transactionId = generateGuid();

		await createTransaction(transactionId, token, establishmentId);

		return json({ token });
	} catch (error) {
		console.error('Token generation error:', error);
		return json({ error: 'Failed to generate token' }, { status: 500 });
	}
};
