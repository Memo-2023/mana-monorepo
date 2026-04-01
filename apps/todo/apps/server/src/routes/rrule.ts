/**
 * RRULE expansion route — server-side compute for recurring tasks.
 *
 * POST /api/v1/compute/next-occurrence
 *   Validates RRULE, calculates next occurrence date.
 *   Called by the client when completing a recurring task.
 */

import { Hono } from 'hono';
import { rrulestr } from 'rrule';
import { z } from 'zod';

const rruleRoutes = new Hono();

const NextOccurrenceSchema = z.object({
	rrule: z.string().min(1, 'Missing rrule parameter').max(500, 'RRULE too long (max 500 chars)'),
	recurrenceEndDate: z.string().datetime({ offset: true }).optional(),
	after: z.string().datetime({ offset: true }).optional(),
});

const ValidateSchema = z.object({
	rrule: z.string().min(1).max(500),
});

/** Validate an RRULE string and return the next occurrence. */
rruleRoutes.post('/next-occurrence', async (c) => {
	const parsed = NextOccurrenceSchema.safeParse(await c.req.json());
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
	}

	const { rrule: rruleString, recurrenceEndDate, after } = parsed.data;

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
	const parsed = ValidateSchema.safeParse(await c.req.json());
	if (!parsed.success) {
		return c.json({ valid: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' });
	}

	const { rrule: rruleString } = parsed.data;

	try {
		const rule = rrulestr(rruleString);
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
