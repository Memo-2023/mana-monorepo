/**
 * Host event routes — JWT-authenticated.
 *
 * Lets the event organizer publish a snapshot of their event, update it,
 * unpublish (delete) it, and read back the public RSVPs they've received.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { eventsPublished, publicRsvps, eventItemsPublished } from '../db/schema/events';
import { ForbiddenError, NotFoundError, BadRequestError } from '../lib/errors';
import type { AuthUser } from '../middleware/jwt-auth';

const snapshotSchema = z.object({
	eventId: z.string().uuid(),
	title: z.string().min(1).max(200),
	description: z.string().max(5000).nullable().optional(),
	location: z.string().max(500).nullable().optional(),
	locationUrl: z.string().url().max(2000).nullable().optional(),
	startAt: z.string().datetime(),
	endAt: z.string().datetime().nullable().optional(),
	allDay: z.boolean().optional(),
	coverImageUrl: z.string().url().max(2000).nullable().optional(),
	color: z.string().max(20).nullable().optional(),
	capacity: z.number().int().positive().nullable().optional(),
});

const snapshotUpdateSchema = snapshotSchema.partial().extend({
	eventId: z.string().uuid(), // still required so we can verify ownership
});

const itemsBodySchema = z.object({
	items: z
		.array(
			z.object({
				id: z.string().min(1).max(64),
				label: z.string().min(1).max(200),
				quantity: z.number().int().positive().nullable().optional(),
				order: z.number().int().min(0),
				done: z.boolean().optional(),
			})
		)
		.max(100),
});

function generateToken(): string {
	// 24-char URL-safe random
	const bytes = new Uint8Array(18);
	crypto.getRandomValues(bytes);
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')
		.slice(0, 24);
}

export function createEventsRoutes(db: Database) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	// POST /events/publish — create a new published snapshot
	app.post('/publish', async (c) => {
		const user = c.get('user');
		const body = await c.req.json().catch(() => null);
		const parsed = snapshotSchema.safeParse(body);
		if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid');

		// Reuse existing token if this event was previously published
		const existing = await db
			.select()
			.from(eventsPublished)
			.where(eq(eventsPublished.eventId, parsed.data.eventId))
			.limit(1);

		if (existing[0]) {
			if (existing[0].userId !== user.userId) throw new ForbiddenError('Not your event');
			await db
				.update(eventsPublished)
				.set({
					title: parsed.data.title,
					description: parsed.data.description ?? null,
					location: parsed.data.location ?? null,
					locationUrl: parsed.data.locationUrl ?? null,
					startAt: new Date(parsed.data.startAt),
					endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
					allDay: parsed.data.allDay ?? false,
					coverImageUrl: parsed.data.coverImageUrl ?? null,
					color: parsed.data.color ?? null,
					capacity: parsed.data.capacity ?? null,
					isCancelled: false,
					updatedAt: new Date(),
				})
				.where(eq(eventsPublished.token, existing[0].token));
			return c.json({ token: existing[0].token, isNew: false });
		}

		const token = generateToken();
		await db.insert(eventsPublished).values({
			token,
			eventId: parsed.data.eventId,
			userId: user.userId,
			title: parsed.data.title,
			description: parsed.data.description ?? null,
			location: parsed.data.location ?? null,
			locationUrl: parsed.data.locationUrl ?? null,
			startAt: new Date(parsed.data.startAt),
			endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
			allDay: parsed.data.allDay ?? false,
			coverImageUrl: parsed.data.coverImageUrl ?? null,
			color: parsed.data.color ?? null,
			capacity: parsed.data.capacity ?? null,
		});
		return c.json({ token, isNew: true });
	});

	// PUT /events/:eventId/snapshot — update an existing snapshot (alias of publish)
	app.put('/:eventId/snapshot', async (c) => {
		const user = c.get('user');
		const eventId = c.req.param('eventId');
		const body = await c.req.json().catch(() => null);
		const parsed = snapshotUpdateSchema.safeParse({ ...body, eventId });
		if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid');

		const existing = await db
			.select()
			.from(eventsPublished)
			.where(eq(eventsPublished.eventId, eventId))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Event not published');
		if (existing[0].userId !== user.userId) throw new ForbiddenError('Not your event');

		const updates: Partial<typeof eventsPublished.$inferInsert> = { updatedAt: new Date() };
		if (parsed.data.title !== undefined) updates.title = parsed.data.title;
		if (parsed.data.description !== undefined) updates.description = parsed.data.description;
		if (parsed.data.location !== undefined) updates.location = parsed.data.location;
		if (parsed.data.locationUrl !== undefined) updates.locationUrl = parsed.data.locationUrl;
		if (parsed.data.startAt !== undefined) updates.startAt = new Date(parsed.data.startAt);
		if (parsed.data.endAt !== undefined)
			updates.endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : null;
		if (parsed.data.allDay !== undefined) updates.allDay = parsed.data.allDay;
		if (parsed.data.coverImageUrl !== undefined) updates.coverImageUrl = parsed.data.coverImageUrl;
		if (parsed.data.color !== undefined) updates.color = parsed.data.color;
		if (parsed.data.capacity !== undefined) updates.capacity = parsed.data.capacity;

		await db
			.update(eventsPublished)
			.set(updates)
			.where(eq(eventsPublished.token, existing[0].token));
		return c.json({ token: existing[0].token });
	});

	// DELETE /events/:eventId — unpublish (cascade-deletes RSVPs)
	app.delete('/:eventId', async (c) => {
		const user = c.get('user');
		const eventId = c.req.param('eventId');
		const existing = await db
			.select()
			.from(eventsPublished)
			.where(eq(eventsPublished.eventId, eventId))
			.limit(1);
		if (!existing[0]) return c.json({ deleted: false });
		if (existing[0].userId !== user.userId) throw new ForbiddenError('Not your event');

		await db.delete(eventsPublished).where(eq(eventsPublished.token, existing[0].token));
		return c.json({ deleted: true });
	});

	// PUT /events/:eventId/items — full-replace the bring list snapshot.
	// Items the host doesn't include get deleted (cascade picks them up
	// only via snapshot delete, so we need an explicit prune here).
	app.put('/:eventId/items', async (c) => {
		const user = c.get('user');
		const eventId = c.req.param('eventId');
		const body = await c.req.json().catch(() => null);
		const parsed = itemsBodySchema.safeParse(body);
		if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid');

		const existing = await db
			.select()
			.from(eventsPublished)
			.where(eq(eventsPublished.eventId, eventId))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Event not published');
		if (existing[0].userId !== user.userId) throw new ForbiddenError('Not your event');

		const token = existing[0].token;
		const now = new Date();
		const incomingIds = new Set(parsed.data.items.map((i) => i.id));

		// Load currently-stored items so we can preserve `claimed_by_name`
		// across host edits — the host shouldn't accidentally wipe a public
		// guest's claim just because they renamed an item.
		const existingItems = await db
			.select()
			.from(eventItemsPublished)
			.where(eq(eventItemsPublished.token, token));
		const existingById = new Map(existingItems.map((it) => [it.id, it]));

		// Delete items the host removed
		for (const it of existingItems) {
			if (!incomingIds.has(it.id)) {
				await db.delete(eventItemsPublished).where(eq(eventItemsPublished.id, it.id));
			}
		}

		// Upsert each incoming item
		for (const item of parsed.data.items) {
			const prior = existingById.get(item.id);
			if (prior) {
				await db
					.update(eventItemsPublished)
					.set({
						label: item.label,
						quantity: item.quantity ?? null,
						sortOrder: item.order,
						done: item.done ?? false,
						updatedAt: now,
					})
					.where(eq(eventItemsPublished.id, item.id));
			} else {
				await db.insert(eventItemsPublished).values({
					id: item.id,
					token,
					label: item.label,
					quantity: item.quantity ?? null,
					sortOrder: item.order,
					done: item.done ?? false,
				});
			}
		}

		return c.json({ ok: true, count: parsed.data.items.length });
	});

	// GET /events/:eventId/items — read back items + claims for the host
	app.get('/:eventId/items', async (c) => {
		const user = c.get('user');
		const eventId = c.req.param('eventId');
		const existing = await db
			.select()
			.from(eventsPublished)
			.where(eq(eventsPublished.eventId, eventId))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Event not published');
		if (existing[0].userId !== user.userId) throw new ForbiddenError('Not your event');

		const items = await db
			.select()
			.from(eventItemsPublished)
			.where(eq(eventItemsPublished.token, existing[0].token));
		return c.json({ items });
	});

	// GET /events/:eventId/rsvps — list all RSVPs for the host
	app.get('/:eventId/rsvps', async (c) => {
		const user = c.get('user');
		const eventId = c.req.param('eventId');
		const existing = await db
			.select()
			.from(eventsPublished)
			.where(eq(eventsPublished.eventId, eventId))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Event not published');
		if (existing[0].userId !== user.userId) throw new ForbiddenError('Not your event');

		const rsvps = await db
			.select()
			.from(publicRsvps)
			.where(eq(publicRsvps.token, existing[0].token));
		return c.json({ token: existing[0].token, rsvps });
	});

	return app;
}
