/**
 * Calendar Hono Server — RRULE expansion + Google Calendar sync
 *
 * CRUD for calendars/events handled by mana-sync.
 * This server handles recurring event expansion and external calendar sync.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@manacore/shared-hono';

const PORT = parseInt(process.env.PORT || '3003', 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('calendar-server'));
app.use('/api/*', authMiddleware());

// ─── RRULE Expansion (server-only: DoS protection) ──────────

app.post('/api/v1/events/expand', async (c) => {
	const { rrule, dtstart, until, maxOccurrences } = await c.req.json();

	if (!rrule || !dtstart) return c.json({ error: 'rrule and dtstart required' }, 400);

	const max = Math.min(maxOccurrences || 365, 5000);

	try {
		// Simple RRULE expansion (daily, weekly, monthly, yearly)
		const start = new Date(dtstart);
		const end = until ? new Date(until) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
		const occurrences: string[] = [];

		const parts = rrule.replace('RRULE:', '').split(';');
		const freq = parts.find((p: string) => p.startsWith('FREQ='))?.split('=')[1];
		const interval = parseInt(
			parts.find((p: string) => p.startsWith('INTERVAL='))?.split('=')[1] || '1',
			10
		);

		let current = new Date(start);

		while (current <= end && occurrences.length < max) {
			occurrences.push(current.toISOString());

			switch (freq) {
				case 'DAILY':
					current = new Date(current.getTime() + interval * 24 * 60 * 60 * 1000);
					break;
				case 'WEEKLY':
					current = new Date(current.getTime() + interval * 7 * 24 * 60 * 60 * 1000);
					break;
				case 'MONTHLY':
					current = new Date(current.setMonth(current.getMonth() + interval));
					break;
				case 'YEARLY':
					current = new Date(current.setFullYear(current.getFullYear() + interval));
					break;
				default:
					occurrences.push(current.toISOString());
					current = end; // Break loop
			}
		}

		return c.json({ occurrences, count: occurrences.length });
	} catch (_err) {
		return c.json({ error: 'RRULE expansion failed' }, 500);
	}
});

// ─── Google Calendar Import (server-only: OAuth) ─────────────

app.post('/api/v1/sync/google', async (c) => {
	// TODO: Implement Google Calendar OAuth flow
	// This requires server-side OAuth token exchange
	return c.json({ error: 'Google Calendar sync not yet implemented' }, 501);
});

// ─── ICS Import (server-only: parsing) ───────────────────────

app.post('/api/v1/import/ics', async (c) => {
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file' }, 400);

	const text = await file.text();
	const events = parseICS(text);
	return c.json({ events, count: events.length });
});

function parseICS(text: string): Array<Record<string, string>> {
	const events: Array<Record<string, string>> = [];
	const blocks = text.split('BEGIN:VEVENT').filter((b) => b.includes('END:VEVENT'));

	for (const block of blocks) {
		const event: Record<string, string> = {};
		const lines = block.split(/\r?\n/);

		for (const line of lines) {
			if (line.startsWith('SUMMARY:')) event.title = line.slice(8);
			if (line.startsWith('DTSTART')) event.start = line.split(':').pop() || '';
			if (line.startsWith('DTEND')) event.end = line.split(':').pop() || '';
			if (line.startsWith('DESCRIPTION:')) event.description = line.slice(12);
			if (line.startsWith('LOCATION:')) event.location = line.slice(9);
			if (line.startsWith('RRULE:')) event.rrule = line.slice(6);
		}

		if (event.title || event.start) events.push(event);
	}

	return events;
}

export default { port: PORT, fetch: app.fetch };
