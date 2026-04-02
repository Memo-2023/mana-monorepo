/**
 * Calendar module — RRULE expansion + ICS import
 * Ported from apps/calendar/apps/server
 */

import { Hono } from 'hono';
import { z } from 'zod';

const routes = new Hono();

// ─── RRULE Expansion (server-only: DoS protection) ──────────

const ExpandSchema = z.object({
	rrule: z.string().min(1).max(500),
	dtstart: z.string().min(1),
	until: z.string().optional(),
	maxOccurrences: z.number().int().min(1).max(5000).optional(),
});

routes.post('/events/expand', async (c) => {
	const parsed = ExpandSchema.safeParse(await c.req.json());
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
	}

	const { rrule, dtstart, until, maxOccurrences } = parsed.data;
	const max = Math.min(maxOccurrences || 365, 5000);

	try {
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
					current = end;
			}
		}

		return c.json({ occurrences, count: occurrences.length });
	} catch {
		return c.json({ error: 'RRULE expansion failed' }, 500);
	}
});

// ─── Google Calendar Import ─────────────────────────────────

routes.post('/sync/google', async (c) => {
	return c.json({ error: 'Google Calendar sync not yet implemented' }, 501);
});

// ─── ICS Import ─────────────────────────────────────────────

routes.post('/import/ics', async (c) => {
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

export { routes as calendarRoutes };
