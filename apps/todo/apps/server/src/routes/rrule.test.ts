import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { rruleRoutes } from './rrule';

const app = new Hono();
app.route('/compute', rruleRoutes);

function post(path: string, body: unknown) {
	return app.request(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

// ─── POST /compute/next-occurrence ─────────────────────────────

describe('POST /compute/next-occurrence', () => {
	it('returns next occurrence for daily RRULE', async () => {
		const res = await post('/compute/next-occurrence', {
			rrule: 'FREQ=DAILY',
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.valid).toBe(true);
		expect(data.nextDate).toBeDefined();
		expect(data.totalOccurrences).toBeGreaterThan(0);
	});

	it('returns next occurrence for weekly RRULE', async () => {
		const res = await post('/compute/next-occurrence', {
			rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.valid).toBe(true);
		expect(data.nextDate).toBeDefined();
	});

	it('returns next occurrence for monthly RRULE', async () => {
		const res = await post('/compute/next-occurrence', {
			rrule: 'FREQ=MONTHLY;BYMONTHDAY=15',
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.valid).toBe(true);
	});

	it('respects recurrenceEndDate', async () => {
		const pastEnd = new Date('2020-01-01').toISOString();
		const res = await post('/compute/next-occurrence', {
			rrule: 'FREQ=DAILY',
			recurrenceEndDate: pastEnd,
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.nextDate).toBeNull();
		expect(data.message).toContain('No more occurrences');
	});

	it('respects after parameter', async () => {
		const afterDate = new Date('2027-06-01T00:00:00Z').toISOString();
		const res = await post('/compute/next-occurrence', {
			rrule: 'FREQ=DAILY',
			after: afterDate,
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		const next = new Date(data.nextDate);
		expect(next.getTime()).toBeGreaterThan(new Date(afterDate).getTime());
	});

	it('rejects empty rrule', async () => {
		const res = await post('/compute/next-occurrence', { rrule: '' });
		expect(res.status).toBe(400);
	});

	it('rejects missing rrule', async () => {
		const res = await post('/compute/next-occurrence', {});
		expect(res.status).toBe(400);
	});

	it('rejects RRULE exceeding max length', async () => {
		const res = await post('/compute/next-occurrence', {
			rrule: 'FREQ=DAILY;' + 'X'.repeat(500),
		});
		expect(res.status).toBe(400);
	});

	it('rejects invalid RRULE string', async () => {
		const res = await post('/compute/next-occurrence', {
			rrule: 'not a valid rrule',
		});
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('Invalid RRULE');
	});

	it('rejects RRULE with too many occurrences (DoS protection)', async () => {
		// FREQ=SECONDLY would generate millions of occurrences
		const res = await post('/compute/next-occurrence', {
			rrule: 'FREQ=SECONDLY',
		});
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('too many occurrences');
	});
});

// ─── POST /compute/validate ────────────────────────────────────

describe('POST /compute/validate', () => {
	it('validates a correct daily RRULE', async () => {
		const res = await post('/compute/validate', { rrule: 'FREQ=DAILY' });
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.valid).toBe(true);
		expect(data.occurrences).toBeGreaterThan(0);
	});

	it('validates a weekly RRULE with BYDAY', async () => {
		const res = await post('/compute/validate', {
			rrule: 'FREQ=WEEKLY;BYDAY=TU,TH',
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.valid).toBe(true);
	});

	it('validates a yearly RRULE', async () => {
		const res = await post('/compute/validate', {
			rrule: 'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25',
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.valid).toBe(true);
		expect(data.occurrences).toBeLessThanOrEqual(10); // max 10 years
	});

	it('returns valid=false for invalid RRULE', async () => {
		const res = await post('/compute/validate', { rrule: 'garbage' });
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.valid).toBe(false);
		expect(data.error).toBeDefined();
	});

	it('rejects empty rrule', async () => {
		const res = await post('/compute/validate', { rrule: '' });
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.valid).toBe(false);
	});

	it('flags RRULE with too many occurrences', async () => {
		const res = await post('/compute/validate', {
			rrule: 'FREQ=SECONDLY',
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.valid).toBe(false);
		expect(data.error).toContain('Too many occurrences');
	});
});
