/**
 * Event Discovery schema — regions, interests, sources, discovered events,
 * and user actions (save/dismiss).
 *
 * All tables live in the `event_discovery` Postgres schema inside `mana_platform`.
 * Data is server-authoritative (not local-first) — the client caches results
 * but the server owns the crawl loop and deduplication.
 */

import {
	pgSchema,
	uuid,
	integer,
	text,
	real,
	timestamp,
	boolean,
	doublePrecision,
	uniqueIndex,
	index,
	jsonb,
} from 'drizzle-orm/pg-core';

export const discoverySchema = pgSchema('event_discovery');

// ─── Regions ────────────────────────────────────────────────────────

/** Geographic areas the user wants to discover events in. */
export const discoveryRegions = discoverySchema.table(
	'discovery_regions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id').notNull(),
		label: text('label').notNull(),
		lat: doublePrecision('lat').notNull(),
		lon: doublePrecision('lon').notNull(),
		radiusKm: integer('radius_km').default(25).notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		userIdx: index('discovery_regions_user_idx').on(t.userId),
	})
);

// ─── Interests ──────────────────────────────────────────────────────

/** User interests for relevance scoring. */
export const discoveryInterests = discoverySchema.table(
	'discovery_interests',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id').notNull(),
		category: text('category').notNull(),
		freetext: text('freetext'),
		weight: real('weight').default(1.0).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		userIdx: index('discovery_interests_user_idx').on(t.userId),
	})
);

// ─── Sources ────────────────────────────────────────────────────────

/** Event sources that are periodically crawled (iCal feeds, websites, …). */
export const discoverySources = discoverySchema.table(
	'discovery_sources',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id').notNull(),
		type: text('type').notNull(), // 'ical' | 'website' | 'api' | 'search_query'
		url: text('url'),
		name: text('name').notNull(),
		regionId: uuid('region_id').references(() => discoveryRegions.id, { onDelete: 'cascade' }),
		crawlIntervalHours: integer('crawl_interval_hours').default(24).notNull(),
		lastCrawledAt: timestamp('last_crawled_at', { withTimezone: true }),
		lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
		errorCount: integer('error_count').default(0).notNull(),
		lastError: text('last_error'),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		userActiveIdx: index('discovery_sources_user_active_idx').on(t.userId, t.isActive),
	})
);

// ─── Discovered Events ──────────────────────────────────────────────

/** Normalized events found by crawling sources. Deduplicated by hash. */
export const discoveredEvents = discoverySchema.table(
	'discovered_events',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		sourceId: uuid('source_id')
			.notNull()
			.references(() => discoverySources.id, { onDelete: 'cascade' }),
		externalId: text('external_id'),
		dedupeHash: text('dedupe_hash').notNull(),
		title: text('title').notNull(),
		description: text('description'),
		location: text('location'),
		lat: doublePrecision('lat'),
		lon: doublePrecision('lon'),
		startAt: timestamp('start_at', { withTimezone: true }).notNull(),
		endAt: timestamp('end_at', { withTimezone: true }),
		allDay: boolean('all_day').default(false).notNull(),
		imageUrl: text('image_url'),
		sourceUrl: text('source_url').notNull(),
		sourceName: text('source_name'),
		category: text('category'),
		priceInfo: text('price_info'),
		rawExtracted: jsonb('raw_extracted'),
		crawledAt: timestamp('crawled_at', { withTimezone: true }).defaultNow().notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
	},
	(t) => ({
		dedupeIdx: uniqueIndex('discovered_events_dedupe_idx').on(t.dedupeHash),
		startIdx: index('discovered_events_start_idx').on(t.startAt),
		sourceIdx: index('discovered_events_source_idx').on(t.sourceId),
	})
);

// ─── User Actions ───────────────────────────────────────────────────

/** Tracks user interaction with discovered events (save, dismiss). */
export const discoveryUserActions = discoverySchema.table(
	'discovery_user_actions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id').notNull(),
		eventId: uuid('event_id')
			.notNull()
			.references(() => discoveredEvents.id, { onDelete: 'cascade' }),
		action: text('action').notNull(), // 'save' | 'dismiss'
		actedAt: timestamp('acted_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		userEventUnique: uniqueIndex('discovery_user_actions_user_event_idx').on(t.userId, t.eventId),
		userIdx: index('discovery_user_actions_user_idx').on(t.userId),
	})
);
