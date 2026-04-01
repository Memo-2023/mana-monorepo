/**
 * Contacts Hono Server — Photo upload + vCard/CSV import
 *
 * CRUD for contacts handled by mana-sync.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
	authMiddleware,
	healthRoute,
	errorHandler,
	notFoundHandler,
	rateLimitMiddleware,
} from '@manacore/shared-hono';

const PORT = parseInt(process.env.PORT || '3004', 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const ALLOWED_AVATAR_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
]);

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('contacts-server'));
app.use('/api/*', rateLimitMiddleware({ max: 100, windowMs: 60_000 }));
app.use('/api/*', authMiddleware());

// ─── Avatar Upload (server-only: S3) ─────────────────────────

app.post('/api/v1/contacts/:id/avatar', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file' }, 400);
	if (file.size > 5 * 1024 * 1024) return c.json({ error: 'Max 5MB' }, 400);
	if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
		return c.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' }, 400);
	}

	try {
		const { createContactsStorage, generateUserFileKey, getContentType } = await import(
			'@manacore/shared-storage'
		);
		const storage = createContactsStorage();
		const key = generateUserFileKey(
			userId,
			`avatar-${c.req.param('id')}.${file.name.split('.').pop()}`
		);
		const buffer = Buffer.from(await file.arrayBuffer());

		const result = await storage.upload(key, buffer, {
			contentType: getContentType(file.name),
			public: true,
		});

		return c.json({ avatarUrl: result.url }, 201);
	} catch (_err) {
		return c.json({ error: 'Upload failed' }, 500);
	}
});

// ─── vCard Import (server-only: parsing) ─────────────────────

app.post('/api/v1/import/vcard', async (c) => {
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

export default { port: PORT, fetch: app.fetch };
