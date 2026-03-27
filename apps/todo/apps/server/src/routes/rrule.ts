/**
 * RRULE expansion route — server-side compute for recurring tasks.
 *
 * POST /api/v1/compute/next-occurrence
 *   Validates RRULE, calculates next occurrence date.
 *   Called by the client when completing a recurring task.
 */

import { Hono } from 'hono';
import { rrulestr } from 'rrule';
import { authMiddleware } from '../lib/auth';

const rruleRoutes = new Hono();

rruleRoutes.use('/*', authMiddleware());

/** Validate an RRULE string and return the next occurrence. */
rruleRoutes.post('/next-occurrence', async (c) => {
	const body = await c.req.json<{
		rrule: string;
		recurrenceEndDate?: string;
		after?: string;
	}>();

	const { rrule: rruleString, recurrenceEndDate, after } = body;

	if (!rruleString) {
		return c.json({ error: 'Missing rrule parameter' }, 400);
	}

	// DoS protection
	if (rruleString.length > 500) {
		return c.json({ error: 'RRULE too long (max 500 chars)' }, 400);
	}

	try {
		const rule = rrulestr(rruleString);
		const afterDate = after ? new Date(after) : new Date();

		// Validate: not too many occurrences
		const maxOccurrences = 5000;
		const tenYearsFromNow = new Date();
		tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

		const occurrences = rule.between(new Date(), tenYearsFromNow, true, (_, count) => {
			return count < maxOccurrences;
		});

		if (occurrences.length >= maxOccurrences) {
			return c.json({ error: 'RRULE generates too many occurrences (max 5000)' }, 400);
		}

		// Get next occurrence
		const nextDate = rule.after(afterDate, false);

		// Check recurrence end date
		if (recurrenceEndDate) {
			const endDate = new Date(recurrenceEndDate);
			if (!nextDate || nextDate > endDate) {
				return c.json({ nextDate: null, message: 'No more occurrences (past end date)' });
			}
		}

		return c.json({
			nextDate: nextDate?.toISOString() ?? null,
			valid: true,
			totalOccurrences: occurrences.length,
		});
	} catch (err) {
		return c.json(
			{ error: 'Invalid RRULE: ' + (err instanceof Error ? err.message : 'unknown') },
			400
		);
	}
});

/** Validate an RRULE without computing next occurrence. */
rruleRoutes.post('/validate', async (c) => {
	const body = await c.req.json<{ rrule: string }>();

	if (!body.rrule || body.rrule.length > 500) {
		return c.json({ valid: false, error: 'Missing or too long' });
	}

	try {
		const rule = rrulestr(body.rrule);
		const tenYearsFromNow = new Date();
		tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

		const count = rule.between(new Date(), tenYearsFromNow, true, (_, c) => c < 5000).length;

		return c.json({
			valid: count < 5000,
			occurrences: count,
			error: count >= 5000 ? 'Too many occurrences' : undefined,
		});
	} catch (err) {
		return c.json({ valid: false, error: err instanceof Error ? err.message : 'Invalid RRULE' });
	}
});

export { rruleRoutes };
