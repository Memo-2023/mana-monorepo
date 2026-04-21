/**
 * Broadcast schema — server-side mirror of sent campaigns + tracking events.
 *
 * Content (subject, body, audience) lives in the webapp's Dexie + sync
 * pipeline — that's the user-authored source. Here we track only what
 * the server produces: per-recipient delivery rows + the open/click/
 * unsubscribe events that flow in from public tracking endpoints.
 *
 * Why server-only?
 *   - Event volume is high (opens can hit thousands per campaign);
 *     round-tripping through the sync layer would be pointless.
 *   - Events are write-once from public endpoints; they don't need
 *     multi-client reconciliation.
 *   - The user's webapp reads aggregate stats via a summary API, not
 *     the raw events table.
 */

import { pgSchema, text, timestamp, jsonb, index, integer, bigserial } from 'drizzle-orm/pg-core';

export const broadcastSchema = pgSchema('broadcast');

// ─── Campaigns ───────────────────────────────────────────

/** Server-side echo of a sent campaign. Populated when bulk-send kicks off.
 *  Keeps just enough metadata to scope events + render audit views. */
export const campaigns = broadcastSchema.table(
	'campaigns',
	{
		// Campaign id from the webapp (LocalCampaign.id) — we intentionally
		// carry it through so Dexie-side + Postgres-side can be joined by
		// a stable external key without an extra lookup.
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		subject: text('subject'),
		fromEmail: text('from_email'),
		fromName: text('from_name'),
		sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
		totalRecipients: integer('total_recipients').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		userIdx: index('broadcast_campaigns_user_idx').on(t.userId),
	})
);

export type BroadcastCampaign = typeof campaigns.$inferSelect;
export type NewBroadcastCampaign = typeof campaigns.$inferInsert;

// ─── Sends (per-recipient delivery record) ──────────────

/**
 * One row per (campaign × recipient). Status advances:
 *   queued → sent → delivered | bounced | failed
 *   any    → unsubscribed (recipient opted out)
 *
 * `tracking_token` is a server-generated random nonce stored here; the
 * HMAC-signed tokens that appear in URLs are derived from
 * {campaignId, id, nonce} via the tracking-token service. Storing the
 * nonce (not the signed token) means a leaked DB row alone can't be used
 * to forge tracking hits.
 */
export const sends = broadcastSchema.table(
	'sends',
	{
		id: text('id').primaryKey(),
		campaignId: text('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		recipientEmail: text('recipient_email').notNull(),
		recipientName: text('recipient_name'),
		/** Stable FK back to the user's contact if the segment pulled from
		 *  contacts; null for ad-hoc lists. Sync key, not authoritative. */
		recipientContactId: text('recipient_contact_id'),
		trackingNonce: text('tracking_nonce').notNull(),
		status: text('status').notNull().default('queued'),
		sentAt: timestamp('sent_at', { withTimezone: true }),
		bouncedAt: timestamp('bounced_at', { withTimezone: true }),
		bounceReason: text('bounce_reason'),
		unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		campaignIdx: index('broadcast_sends_campaign_idx').on(t.campaignId),
		statusIdx: index('broadcast_sends_status_idx').on(t.status),
		emailIdx: index('broadcast_sends_email_idx').on(t.recipientEmail),
	})
);

export type BroadcastSend = typeof sends.$inferSelect;
export type NewBroadcastSend = typeof sends.$inferInsert;

// ─── Events (opens, clicks, unsubscribes) ───────────────

/**
 * Append-only event log. Every hit on a tracking endpoint becomes a row.
 * Dedup happens at query time (COUNT DISTINCT on send_id + day) because
 * trying to dedup at write time creates contention on the hot tracking
 * path — a duplicate event row is cheaper than a transaction.
 */
export const events = broadcastSchema.table(
	'events',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		sendId: text('send_id')
			.notNull()
			.references(() => sends.id, { onDelete: 'cascade' }),
		kind: text('kind').notNull(), // 'open' | 'click' | 'unsubscribe'
		occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
		/** HMAC hash — not PII, just for same-recipient dedup inside a window. */
		ipHash: text('ip_hash'),
		userAgentHash: text('user_agent_hash'),
		linkUrl: text('link_url'),
		metadata: jsonb('metadata'),
	},
	(t) => ({
		sendKindIdx: index('broadcast_events_send_kind_idx').on(t.sendId, t.kind),
		occurredIdx: index('broadcast_events_occurred_idx').on(t.occurredAt),
	})
);

export type BroadcastEvent = typeof events.$inferSelect;
export type NewBroadcastEvent = typeof events.$inferInsert;
