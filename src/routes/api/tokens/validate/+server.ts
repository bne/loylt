import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateAndUseToken } from '$lib/db/queries';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { token, customerGuid } = await request.json();

		if (!token || !customerGuid) {
			return json({ error: 'Token and customer GUID required' }, { status: 400 });
		}

		const result = await validateAndUseToken(token, customerGuid);

		if (!result.valid) {
			const message = result.alreadyRedeemed
				? 'You have already used this token'
				: 'Invalid token';
			return json({ error: message }, { status: 400 });
		}

		return json({
			success: true,
			establishmentId: result.establishmentId
		});
	} catch (error) {
		console.error('Token validation error:', error);
		return json({ error: 'Failed to validate token' }, { status: 500 });
	}
};
