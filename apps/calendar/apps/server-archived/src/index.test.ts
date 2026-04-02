import { describe, it, expect } from 'vitest';
import { app } from './index';

function post(path: string, body: unknown) {
	return app.request(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

function formPost(path: string, formData: FormData) {
	return app.request(path, { method: 'POST', body: formData });
}

// ─── Health ────────────────────────────────────────────────────

describe('GET /health', () => {
	it('returns healthy status', async () => {
		const res = await app.request('/health');
		expect(res.status).toBe(200);
	});
});

// ─── RRULE Expansion ───────────────────────────────────────────

describe('POST /api/v1/events/expand', () => {
	it('expands daily RRULE', async () => {
		const res = await post('/api/v1/events/expand', {
			rrule: 'FREQ=DAILY',
			dtstart: '2026-01-01T00:00:00Z',
			maxOccurrences: 7,
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.occurrences).toHaveLength(7);
		expect(data.count).toBe(7);
		expect(data.occurrences[0]).toContain('2026-01-01');
	});

	it('expands weekly RRULE', async () => {
		const res = await post('/api/v1/events/expand', {
			rrule: 'FREQ=WEEKLY',
			dtstart: '2026-01-05T10:00:00Z',
			maxOccurrences: 4,
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.occurrences).toHaveLength(4);
		// Each occurrence should be 7 days apart
		const dates = data.occurrences.map((d: string) => new Date(d).getTime());
		const weekMs = 7 * 24 * 60 * 60 * 1000;
		expect(dates[1] - dates[0]).toBe(weekMs);
	});

	it('expands monthly RRULE', async () => {
		const res = await post('/api/v1/events/expand', {
			rrule: 'FREQ=MONTHLY',
			dtstart: '2026-01-15T09:00:00Z',
			maxOccurrences: 3,
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(3);
		expect(data.occurrences[0]).toContain('2026-01-15');
		expect(data.occurrences[1]).toContain('2026-02-15');
		expect(data.occurrences[2]).toContain('2026-03-15');
	});

	it('expands yearly RRULE', async () => {
		const res = await post('/api/v1/events/expand', {
			rrule: 'FREQ=YEARLY',
			dtstart: '2026-06-01T00:00:00Z',
			maxOccurrences: 3,
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(3);
	});

	it('respects INTERVAL', async () => {
		const res = await post('/api/v1/events/expand', {
			rrule: 'FREQ=DAILY;INTERVAL=3',
			dtstart: '2026-01-01T00:00:00Z',
			maxOccurrences: 4,
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		const dates = data.occurrences.map((d: string) => new Date(d).getTime());
		const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
		expect(dates[1] - dates[0]).toBe(threeDaysMs);
	});

	it('stops at until date', async () => {
		const res = await post('/api/v1/events/expand', {
			rrule: 'FREQ=DAILY',
			dtstart: '2026-01-01T00:00:00Z',
			until: '2026-01-05T00:00:00Z',
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(5); // Jan 1-5 inclusive
	});

	it('enforces max 5000 occurrences', async () => {
		const res = await post('/api/v1/events/expand', {
			rrule: 'FREQ=DAILY',
			dtstart: '2000-01-01T00:00:00Z',
			maxOccurrences: 10000,
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBeLessThanOrEqual(5000);
	});

	it('rejects missing rrule', async () => {
		const res = await post('/api/v1/events/expand', {
			dtstart: '2026-01-01T00:00:00Z',
		});
		expect(res.status).toBe(400);
	});

	it('rejects missing dtstart', async () => {
		const res = await post('/api/v1/events/expand', {
			rrule: 'FREQ=DAILY',
		});
		expect(res.status).toBe(400);
	});

	it('rejects empty rrule', async () => {
		const res = await post('/api/v1/events/expand', {
			rrule: '',
			dtstart: '2026-01-01T00:00:00Z',
		});
		expect(res.status).toBe(400);
	});

	it('rejects rrule exceeding max length', async () => {
		const res = await post('/api/v1/events/expand', {
			rrule: 'F'.repeat(501),
			dtstart: '2026-01-01T00:00:00Z',
		});
		expect(res.status).toBe(400);
	});
});

// ─── Google Calendar Sync ──────────────────────────────────────

describe('POST /api/v1/sync/google', () => {
	it('returns 501 Not Implemented', async () => {
		const res = await post('/api/v1/sync/google', {});
		expect(res.status).toBe(501);

		const data = await res.json();
		expect(data.error).toContain('not yet implemented');
	});
});

// ─── ICS Import ────────────────────────────────────────────────

describe('POST /api/v1/import/ics', () => {
	it('parses a valid ICS file with one event', async () => {
		const ics = [
			'BEGIN:VCALENDAR',
			'BEGIN:VEVENT',
			'SUMMARY:Team Meeting',
			'DTSTART:20260615T140000Z',
			'DTEND:20260615T150000Z',
			'DESCRIPTION:Weekly sync',
			'LOCATION:Room 42',
			'END:VEVENT',
			'END:VCALENDAR',
		].join('\r\n');

		const form = new FormData();
		form.append('file', new File([ics], 'cal.ics', { type: 'text/calendar' }));

		const res = await formPost('/api/v1/import/ics', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(1);
		expect(data.events[0].title).toBe('Team Meeting');
		expect(data.events[0].start).toBe('20260615T140000Z');
		expect(data.events[0].end).toBe('20260615T150000Z');
		expect(data.events[0].description).toBe('Weekly sync');
		expect(data.events[0].location).toBe('Room 42');
	});

	it('parses multiple events', async () => {
		const ics = [
			'BEGIN:VCALENDAR',
			'BEGIN:VEVENT',
			'SUMMARY:Event One',
			'DTSTART:20260601T090000Z',
			'DTEND:20260601T100000Z',
			'END:VEVENT',
			'BEGIN:VEVENT',
			'SUMMARY:Event Two',
			'DTSTART:20260602T110000Z',
			'DTEND:20260602T120000Z',
			'END:VEVENT',
			'BEGIN:VEVENT',
			'SUMMARY:Event Three',
			'DTSTART:20260603T130000Z',
			'DTEND:20260603T140000Z',
			'END:VEVENT',
			'END:VCALENDAR',
		].join('\r\n');

		const form = new FormData();
		form.append('file', new File([ics], 'multi.ics', { type: 'text/calendar' }));

		const res = await formPost('/api/v1/import/ics', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(3);
		expect(data.events[0].title).toBe('Event One');
		expect(data.events[2].title).toBe('Event Three');
	});

	it('parses event with RRULE', async () => {
		const ics = [
			'BEGIN:VCALENDAR',
			'BEGIN:VEVENT',
			'SUMMARY:Daily Standup',
			'DTSTART:20260101T090000Z',
			'RRULE:FREQ=DAILY;COUNT=5',
			'END:VEVENT',
			'END:VCALENDAR',
		].join('\n');

		const form = new FormData();
		form.append('file', new File([ics], 'recurring.ics'));

		const res = await formPost('/api/v1/import/ics', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.events[0].rrule).toBe('FREQ=DAILY;COUNT=5');
	});

	it('handles ICS with DTSTART parameters', async () => {
		const ics = [
			'BEGIN:VCALENDAR',
			'BEGIN:VEVENT',
			'SUMMARY:All Day Event',
			'DTSTART;VALUE=DATE:20260701',
			'DTEND;VALUE=DATE:20260702',
			'END:VEVENT',
			'END:VCALENDAR',
		].join('\r\n');

		const form = new FormData();
		form.append('file', new File([ics], 'allday.ics'));

		const res = await formPost('/api/v1/import/ics', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(1);
		// DTSTART;VALUE=DATE:20260701 → split(':').pop() → '20260701'
		expect(data.events[0].start).toBe('20260701');
	});

	it('skips events without title and start', async () => {
		const ics = [
			'BEGIN:VCALENDAR',
			'BEGIN:VEVENT',
			'DESCRIPTION:No title or start',
			'END:VEVENT',
			'BEGIN:VEVENT',
			'SUMMARY:Valid Event',
			'DTSTART:20260101T090000Z',
			'END:VEVENT',
			'END:VCALENDAR',
		].join('\n');

		const form = new FormData();
		form.append('file', new File([ics], 'partial.ics'));

		const res = await formPost('/api/v1/import/ics', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(1);
		expect(data.events[0].title).toBe('Valid Event');
	});

	it('returns empty array for ICS without events', async () => {
		const ics = 'BEGIN:VCALENDAR\r\nEND:VCALENDAR';

		const form = new FormData();
		form.append('file', new File([ics], 'empty.ics'));

		const res = await formPost('/api/v1/import/ics', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(0);
		expect(data.events).toEqual([]);
	});

	it('returns 400 if no file provided', async () => {
		const form = new FormData();
		const res = await formPost('/api/v1/import/ics', form);
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.error).toBe('No file');
	});
});
