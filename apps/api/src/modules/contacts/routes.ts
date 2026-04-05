/**
 * Contacts module — Avatar upload + vCard import
 * Ported from apps/contacts/apps/server
 */

import { Hono } from 'hono';

const ALLOWED_AVATAR_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
]);

const routes = new Hono();

// ─── Avatar Upload (S3) ─────────────────────────────────────

routes.post('/:id/avatar', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file' }, 400);
	if (file.size > 5 * 1024 * 1024) return c.json({ error: 'Max 5MB' }, 400);
	if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
		return c.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' }, 400);
	}

	try {
		const buffer = await file.arrayBuffer();

		if (file.type === 'image/svg+xml') {
			// SVGs stay on shared-storage (Sharp can't process SVG)
			const { createContactsStorage, generateUserFileKey } = await import(
				'@mana/shared-storage'
			);
			const storage = createContactsStorage();
			const key = generateUserFileKey(userId, `avatar-${c.req.param('id')}.svg`);
			const result = await storage.upload(key, Buffer.from(buffer), {
				contentType: 'image/svg+xml',
				public: true,
			});
			return c.json({ avatarUrl: result.url }, 201);
		}

		// Raster images -> mana-media for dedup, thumbnails & Photos gallery
		const { uploadImageToMedia } = await import('../../lib/media');
		const result = await uploadImageToMedia(
			buffer,
			`avatar-${c.req.param('id')}.${file.name.split('.').pop()}`,
			{ app: 'contacts', userId }
		);

		return c.json(
			{
				avatarUrl: result.urls.thumbnail || result.urls.original,
				mediaId: result.id,
			},
			201
		);
	} catch {
		return c.json({ error: 'Upload failed' }, 500);
	}
});

// ─── vCard Import ───────────────────────────────────────────

routes.post('/import/vcard', async (c) => {
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;
	if (!file) return c.json({ error: 'No file' }, 400);

	const text = await file.text();
	const contacts = parseVCard(text);
	return c.json({ contacts, count: contacts.length });
});

function parseVCard(text: string): Array<Record<string, string>> {
	const contacts: Array<Record<string, string>> = [];
	const cards = text.split('BEGIN:VCARD').filter((c) => c.includes('END:VCARD'));

	for (const card of cards) {
		const contact: Record<string, string> = {};
		const lines = card.split(/\r?\n/);

		for (const line of lines) {
			if (line.startsWith('FN:')) contact.name = line.slice(3);
			if (line.startsWith('EMAIL')) contact.email = line.split(':').pop() || '';
			if (line.startsWith('TEL')) contact.phone = line.split(':').pop() || '';
			if (line.startsWith('ORG:')) contact.company = line.slice(4);
			if (line.startsWith('TITLE:')) contact.title = line.slice(6);
		}

		if (contact.name || contact.email) contacts.push(contact);
	}

	return contacts;
}

export { routes as contactsRoutes };
