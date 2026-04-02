/**
 * uLoad database schema — minimal server-side tables only.
 *
 * Links, tags, folders are handled via local-first (IndexedDB → mana-sync → sync_changes).
 * Only clicks need a dedicated table for performant analytics aggregation.
 *
 * The uload-server reads links from sync_changes and writes clicks here.
 */

import { pgSchema, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const uloadSchema = pgSchema('uload');

// ============================================
// Clicks Table — server-generated click tracking
// ============================================
export const clicks = uloadSchema.table(
	'clicks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		linkId: text('link_id').notNull(),
		ipHash: text('ip_hash'),
		userAgent: text('user_agent'),
		referer: text('referer'),
		browser: text('browser'),
		deviceType: text('device_type'),
		os: text('os'),
		country: text('country'),
		city: text('city'),
		clickedAt: timestamp('clicked_at').defaultNow().notNull(),
		utmSource: text('utm_source'),
		utmMedium: text('utm_medium'),
		utmCampaign: text('utm_campaign'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => ({
		linkIdIdx: index('clicks_link_id_idx').on(table.linkId),
		clickedAtIdx: index('clicks_clicked_at_idx').on(table.clickedAt),
		countryIdx: index('clicks_country_idx').on(table.country),
		deviceTypeIdx: index('clicks_device_type_idx').on(table.deviceType),
	})
);
