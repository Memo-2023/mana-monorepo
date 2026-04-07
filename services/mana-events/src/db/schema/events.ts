/**
 * Events schema — published event snapshots and public RSVP responses.
 *
 * `events_published` is a server-side cache of an event's public-facing
 * metadata, written by the host's client when they "publish" the event.
 * It is the source of truth that the public RSVP page reads from.
 */

import {
	pgSchema,
	uuid,
	integer,
	text,
	timestamp,
	boolean,
	uniqueIndex,
	index,
} from 'drizzle-orm/pg-core';

export const eventsSchema = pgSchema('events');

/** Published event snapshots — one per token. */
export const eventsPublished = eventsSchema.table(
	'events_published',
	{
		token: text('token').primaryKey(),
		eventId: uuid('event_id').notNull(),
		userId: text('user_id').notNull(), // host
		title: text('title').notNull(),
		description: text('description'),
		location: text('location'),
		locationUrl: text('location_url'),
		startAt: timestamp('start_at', { withTimezone: true }).notNull(),
		endAt: timestamp('end_at', { withTimezone: true }),
		allDay: boolean('all_day').default(false).notNull(),
		coverImageUrl: text('cover_image_url'),
		color: text('color'),
		capacity: integer('capacity'),
		isCancelled: boolean('is_cancelled').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		userIdIdx: index('events_published_user_id_idx').on(t.userId),
		eventIdIdx: index('events_published_event_id_idx').on(t.eventId),
	})
);

/** Public RSVP responses — submitted via the share link, no auth. */
export const publicRsvps = eventsSchema.table(
	'public_rsvps',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		token: text('token')
			.notNull()
			.references(() => eventsPublished.token, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		email: text('email'),
		status: text('status').notNull(), // 'yes' | 'no' | 'maybe'
		plusOnes: integer('plus_ones').default(0).notNull(),
		note: text('note'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		tokenIdx: index('public_rsvps_token_idx').on(t.token),
		// Best-effort dedup: same token + same lowercase name + same lowercase email = same person.
		// Email may be null, so we coalesce to '' for the index.
		uniquePerson: uniqueIndex('public_rsvps_token_name_email_unique').on(t.token, t.name, t.email),
	})
);

/**
 * Bring-list items attached to a published event. The host pushes the
 * full list whenever it changes (small payload). Each row is owned by
 * its parent events_published row via FK cascade so it disappears
 * when the snapshot is deleted.
 *
 * `claimed_by_name` is set when a public RSVP visitor reserves the
 * item from the share-link page. Only one claim per item — we don't
 * support unclaim-then-reclaim conflict resolution; the host can
 * always overwrite via a republish.
 */
export const eventItemsPublished = eventsSchema.table(
	'event_items_published',
	{
		id: text('id').primaryKey(),
		token: text('token')
			.notNull()
			.references(() => eventsPublished.token, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		quantity: integer('quantity'),
		sortOrder: integer('sort_order').default(0).notNull(),
		done: boolean('done').default(false).notNull(),
		claimedByName: text('claimed_by_name'),
		claimedAt: timestamp('claimed_at', { withTimezone: true }),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => ({
		tokenIdx: index('event_items_published_token_idx').on(t.token),
	})
);

/** Per-token rate limit bucket — token + hour-bucket → submission count. */
export const rsvpRateBuckets = eventsSchema.table(
	'rsvp_rate_buckets',
	{
		token: text('token')
			.notNull()
			.references(() => eventsPublished.token, { onDelete: 'cascade' }),
		hourBucket: text('hour_bucket').notNull(), // YYYY-MM-DDTHH
		count: integer('count').default(0).notNull(),
	},
	(t) => ({
		pk: uniqueIndex('rsvp_rate_buckets_pk').on(t.token, t.hourBucket),
	})
);
