/**
 * Discovery feed routes — paginated event feed + user actions.
 *
 * The feed endpoint returns discovered events sorted by start date,
 * filtered by date range and optional category, enriched with the
 * user's action status (saved/dismissed/null).
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, gte, lte, sql, isNull, desc, asc } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { discoveredEvents, discoveryUserActions, discoverySources } from '../db/schema/discovery';
import { BadRequestError } from '../lib/errors';
import type { AuthUser } from '../middleware/jwt-auth';

const feedQuerySchema = z.object({
	from: z.string().datetime().optional(),
	to: z.string().datetime().optional(),
	category: z.string().max(50).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	offset: z.coerce.number().int().min(0).optional(),
	hideDismissed: z.coerce.boolean().optional(),
});

const actionSchema = z.object({
	action: z.enum(['save', 'dismiss']),
});

export function createDiscoveryFeedRoutes(db: Database) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	/**
	 * GET /feed — paginated discovered events.
	 *
	 * Joins with user actions to include save/dismiss status.
	 * Only shows events from the current user's sources.
	 */
	app.get('/feed', async (c) => {
		const user = c.get('user');
		const query = feedQuerySchema.safeParse(c.req.query());
		if (!query.success) throw new BadRequestError(query.error.issues[0]?.message ?? 'Invalid');

		const { from, to, category, hideDismissed } = query.data;
		const limit = query.data.limit ?? 20;
		const offset = query.data.offset ?? 0;

		// Build WHERE conditions
		const conditions = [
			// Only events from this user's sources
			eq(discoverySources.userId, user.userId),
			eq(discoverySources.isActive, true),
			// Only future events (or today)
			gte(discoveredEvents.startAt, from ? new Date(from) : new Date()),
		];

		if (to) {
			conditions.push(lte(discoveredEvents.startAt, new Date(to)));
		}
		if (category) {
			conditions.push(eq(discoveredEvents.category, category));
		}

		// Query events with left join on user actions
		const rows = await db
			.select({
				id: discoveredEvents.id,
				title: discoveredEvents.title,
				description: discoveredEvents.description,
				location: discoveredEvents.location,
				lat: discoveredEvents.lat,
				lon: discoveredEvents.lon,
				startAt: discoveredEvents.startAt,
				endAt: discoveredEvents.endAt,
				allDay: discoveredEvents.allDay,
				imageUrl: discoveredEvents.imageUrl,
				sourceUrl: discoveredEvents.sourceUrl,
				sourceName: discoveredEvents.sourceName,
				category: discoveredEvents.category,
				priceInfo: discoveredEvents.priceInfo,
				crawledAt: discoveredEvents.crawledAt,
				userAction: discoveryUserActions.action,
			})
			.from(discoveredEvents)
			.innerJoin(discoverySources, eq(discoveredEvents.sourceId, discoverySources.id))
			.leftJoin(
				discoveryUserActions,
				and(
					eq(discoveryUserActions.eventId, discoveredEvents.id),
					eq(discoveryUserActions.userId, user.userId)
				)
			)
			.where(and(...conditions))
			.orderBy(asc(discoveredEvents.startAt))
			.limit(limit + 1) // fetch one extra to determine hasMore
			.offset(offset);

		// Filter dismissed events client-side if requested
		const filtered = hideDismissed ? rows.filter((r) => r.userAction !== 'dismiss') : rows;

		const hasMore = filtered.length > limit;
		const events = filtered.slice(0, limit);

		return c.json({ events, total: events.length, hasMore });
	});

	/**
	 * POST /feed/:eventId/action — save or dismiss a discovered event.
	 */
	app.post('/feed/:eventId/action', async (c) => {
		const user = c.get('user');
		const eventId = c.req.param('eventId');
		const body = await c.req.json().catch(() => null);
		const parsed = actionSchema.safeParse(body);
		if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid');

		await db
			.insert(discoveryUserActions)
			.values({
				userId: user.userId,
				eventId,
				action: parsed.data.action,
			})
			.onConflictDoUpdate({
				target: [discoveryUserActions.userId, discoveryUserActions.eventId],
				set: {
					action: parsed.data.action,
					actedAt: new Date(),
				},
			});

		return c.json({ ok: true });
	});

	return app;
}
