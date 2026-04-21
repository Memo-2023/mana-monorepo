/**
 * GET /v1/mail/campaigns/:id/events — JWT auth.
 *
 * Aggregate stats for a campaign. Returns counts derived from the
 * events table plus delivery status from sends. The webapp's
 * BroadcastStats type mirrors this response shape.
 */

import { Hono } from 'hono';
import { eq, sql, and } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { campaigns, sends, events } from '../db/schema';
import type { AuthUser } from '../middleware/jwt-auth';

export function createBroadcastStatsRoutes(db: Database) {
	return new Hono<{ Variables: { user: AuthUser } }>().get('/campaigns/:id/events', async (c) => {
		const user = c.get('user');
		const campaignId = c.req.param('id');

		// Ownership check: only the campaign's creator sees its stats.
		const campaign = await db
			.select()
			.from(campaigns)
			.where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, user.userId)))
			.limit(1);
		if (campaign.length === 0) {
			return c.json({ error: 'not found' }, 404);
		}

		// Aggregate delivery status counts.
		const deliveryRows = await db
			.select({
				status: sends.status,
				count: sql<number>`count(*)::int`,
			})
			.from(sends)
			.where(eq(sends.campaignId, campaignId))
			.groupBy(sends.status);
		const delivery = Object.fromEntries(deliveryRows.map((r) => [r.status, r.count])) as Record<
			string,
			number
		>;

		// Distinct-recipient event counts. COUNT(DISTINCT send_id) gives
		// us the "unique opens / clicks" the user actually cares about;
		// raw open counts include re-opens and image-proxy fetches.
		const eventRows = await db
			.select({
				kind: events.kind,
				uniqueCount: sql<number>`count(distinct ${events.sendId})::int`,
				totalCount: sql<number>`count(*)::int`,
			})
			.from(events)
			.innerJoin(sends, eq(events.sendId, sends.id))
			.where(eq(sends.campaignId, campaignId))
			.groupBy(events.kind);
		const eventCounts = Object.fromEntries(
			eventRows.map((r) => [r.kind, { unique: r.uniqueCount, total: r.totalCount }])
		) as Record<string, { unique: number; total: number }>;

		return c.json({
			campaignId,
			totalRecipients: campaign[0].totalRecipients,
			delivery: {
				queued: delivery.queued ?? 0,
				sent: delivery.sent ?? 0,
				delivered: delivery.delivered ?? 0,
				bounced: delivery.bounced ?? 0,
				failed: delivery.failed ?? 0,
				unsubscribed: delivery.unsubscribed ?? 0,
			},
			opens: eventCounts.open ?? { unique: 0, total: 0 },
			clicks: eventCounts.click ?? { unique: 0, total: 0 },
			unsubscribes: eventCounts.unsubscribe ?? { unique: 0, total: 0 },
			lastSyncedAt: new Date().toISOString(),
		});
	});
}
