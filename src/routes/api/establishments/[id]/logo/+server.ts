import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { put, del } from '@vercel/blob';
import { getEstablishment, updateEstablishment } from '$lib/db/queries';

const MAX_FILE_SIZE = 250 * 1024; // 250KB

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;

		if (user.role === 'establishment_admin' && user.establishment_id !== id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const establishment = await getEstablishment(id);
		if (!establishment) {
			return json({ error: 'Establishment not found' }, { status: 404 });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		if (file.size > MAX_FILE_SIZE) {
			return json({ error: 'File too large. Maximum size is 250KB.' }, { status: 400 });
		}

		if (!file.type.startsWith('image/')) {
			return json({ error: 'File must be an image' }, { status: 400 });
		}

		// Delete old logo if exists
		if (establishment.logo_url) {
			try {
				await del(establishment.logo_url);
			} catch {
				// Ignore deletion errors for old blob
			}
		}

		const blob = await put(`logos/${id}/${file.name}`, file, {
			access: 'public',
			contentType: file.type
		});

		await updateEstablishment(id, undefined, undefined, undefined, undefined, blob.url);

		return json({ logoUrl: blob.url });
	} catch (error) {
		console.error('Logo upload error:', error);
		return json({ error: 'Failed to upload logo' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;

		if (user.role === 'establishment_admin' && user.establishment_id !== id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const establishment = await getEstablishment(id);
		if (!establishment) {
			return json({ error: 'Establishment not found' }, { status: 404 });
		}

		if (establishment.logo_url) {
			try {
				await del(establishment.logo_url);
			} catch {
				// Ignore deletion errors
			}
		}

		await updateEstablishment(id, undefined, undefined, undefined, undefined, null);

		return json({ success: true });
	} catch (error) {
		console.error('Logo delete error:', error);
		return json({ error: 'Failed to delete logo' }, { status: 500 });
	}
};
