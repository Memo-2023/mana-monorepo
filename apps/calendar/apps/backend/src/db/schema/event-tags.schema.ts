import {
	pgTable,
	uuid,
	text,
	timestamp,
	varchar,
	primaryKey,
	index,
	integer,
} from 'drizzle-orm/pg-core';
import { events } from './events.schema';
import { eventTagGroups } from './event-tag-groups.schema';

/**
 * Event tags table - stores user-defined tags with colors
 */
export const eventTags = pgTable(
	'event_tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: varchar('name', { length: 100 }).notNull(),
		color: varchar('color', { length: 7 }).default('#3B82F6'),
		groupId: uuid('group_id').references(() => eventTagGroups.id, { onDelete: 'set null' }),
		sortOrder: integer('sort_order').default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('event_tags_user_idx').on(table.userId),
		groupIdx: index('event_tags_group_idx').on(table.groupId),
	})
);

/**
 * Event to tags junction table - many-to-many relationship
 */
export const eventToTags = pgTable(
	'event_to_tags',
	{
		eventId: uuid('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => eventTags.id, { onDelete: 'cascade' }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.eventId, table.tagId] }),
		eventIdx: index('event_to_tags_event_idx').on(table.eventId),
		tagIdx: index('event_to_tags_tag_idx').on(table.tagId),
	})
);

export type EventTag = typeof eventTags.$inferSelect;
export type NewEventTag = typeof eventTags.$inferInsert;
export type EventToTag = typeof eventToTags.$inferSelect;
export type NewEventToTag = typeof eventToTags.$inferInsert;
