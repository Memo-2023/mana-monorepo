/**
 * Public RSVP routes — no authentication.
 *
 * Anyone with a share link can view the event snapshot and submit an RSVP.
 * Protected by per-token rate limiting and a hard total cap.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { eventsPublished, publicRsvps, rsvpRateBuckets } from '../db/schema/events';
import { NotFoundError, BadRequestError, TooManyRequestsError } from '../lib/errors';
import type { Config } from '../config';

const rsvpBodySchema = z.object({
	name: z.string().min(1).max(100),
	email: z.string().email().max(200).optional().nullable(),
	status: z.enum(['yes', 'no', 'maybe']),
	plusOnes: z.number().int().min(0).max(20).optional().default(0),
	note: z.string().max(1000).optional().nullable(),
});

function currentHourBucket(): string {
	const d = new Date();
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}`;
}

export function createRsvpRoutes(db: Database, config: Config) {
	const app = new Hono();

	// GET /rsvp/:token — public event snapshot + summary
	app.get('/:token', async (c) => {
		const token = c.req.param('token');
		const rows = await db
			.select()
			.from(eventsPublished)
			.where(eq(eventsPublished.token, token))
			.limit(1);
		const event = rows[0];
		if (!event) throw new NotFoundError('Event not found');
		if (event.isCancelled) {
			return c.json({ event: { ...event, isCancelled: true }, summary: null, cancelled: true });
		}

		// Compute summary (counts only — never expose individual responses publicly)
		const all = await db
			.select({ status: publicRsvps.status, plusOnes: publicRsvps.plusOnes })
			.from(publicRsvps)
			.where(eq(publicRsvps.token, token));

		const summary = { yes: 0, no: 0, maybe: 0, totalAttending: 0 };
		for (const r of all) {
			if (r.status === 'yes') {
				summary.yes++;
				summary.totalAttending += 1 + (r.plusOnes ?? 0);
			} else if (r.status === 'no') summary.no++;
			else if (r.status === 'maybe') summary.maybe++;
		}

		return c.json({
			event: {
				token: event.token,
				title: event.title,
				description: event.description,
				location: event.location,
				locationUrl: event.locationUrl,
				startAt: event.startAt,
				endAt: event.endAt,
				allDay: event.allDay,
				coverImageUrl: event.coverImageUrl,
				color: event.color,
				capacity: event.capacity,
			},
			summary,
		});
	});

	// POST /rsvp/:token — submit/update an RSVP
	app.post('/:token', async (c) => {
		const token = c.req.param('token');
		const body = await c.req.json().catch(() => null);
		const parsed = rsvpBodySchema.safeParse(body);
		if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid');

		// Verify event exists & isn't cancelled
		const eventRows = await db
			.select()
			.from(eventsPublished)
			.where(eq(eventsPublished.token, token))
			.limit(1);
		const event = eventRows[0];
		if (!event) throw new NotFoundError('Event not found');
		if (event.isCancelled) throw new BadRequestError('Event has been cancelled');

		// Hard total-cap check
		const totalRows = await db
			.select({ c: sql<number>`count(*)::int` })
			.from(publicRsvps)
			.where(eq(publicRsvps.token, token));
		const total = totalRows[0]?.c ?? 0;
		if (total >= config.rateLimit.rsvpMaxPerToken) {
			throw new TooManyRequestsError('Maximum RSVPs reached for this event');
		}

		// Per-token hourly rate limit
		const bucket = currentHourBucket();
		const bucketRows = await db
			.select()
			.from(rsvpRateBuckets)
			.where(and(eq(rsvpRateBuckets.token, token), eq(rsvpRateBuckets.hourBucket, bucket)))
			.limit(1);
		const currentCount = bucketRows[0]?.count ?? 0;
		if (currentCount >= config.rateLimit.rsvpPerTokenPerHour) {
			throw new TooManyRequestsError('Too many submissions, please try again later');
		}

		// Upsert RSVP — same (token, name, email) overwrites
		const existing = await db
			.select()
			.from(publicRsvps)
			.where(
				and(
					eq(publicRsvps.token, token),
					eq(publicRsvps.name, parsed.data.name),
					parsed.data.email
						? eq(publicRsvps.email, parsed.data.email)
						: sql`${publicRsvps.email} is null`
				)
			)
			.limit(1);

		if (existing[0]) {
			await db
				.update(publicRsvps)
				.set({
					status: parsed.data.status,
					plusOnes: parsed.data.plusOnes ?? 0,
					note: parsed.data.note ?? null,
					updatedAt: new Date(),
				})
				.where(eq(publicRsvps.id, existing[0].id));
		} else {
			await db.insert(publicRsvps).values({
				token,
				name: parsed.data.name,
				email: parsed.data.email ?? null,
				status: parsed.data.status,
				plusOnes: parsed.data.plusOnes ?? 0,
				note: parsed.data.note ?? null,
			});
		}

		// Increment rate bucket
		if (bucketRows[0]) {
			await db
				.update(rsvpRateBuckets)
				.set({ count: bucketRows[0].count + 1 })
				.where(and(eq(rsvpRateBuckets.token, token), eq(rsvpRateBuckets.hourBucket, bucket)));
		} else {
			await db.insert(rsvpRateBuckets).values({ token, hourBucket: bucket, count: 1 });
		}

		return c.json({ ok: true });
	});

	return app;
}
