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

/** Per-token rate limit bucket — token + hour-bucket → submission count. */
export const rsvpRateBuckets = eventsSchema.table(
	'rsvp_rate_buckets',
	{
		token: text('token').notNull(),
		hourBucket: text('hour_bucket').notNull(), // YYYY-MM-DDTHH
		count: integer('count').default(0).notNull(),
	},
	(t) => ({
		pk: uniqueIndex('rsvp_rate_buckets_pk').on(t.token, t.hourBucket),
	})
);
