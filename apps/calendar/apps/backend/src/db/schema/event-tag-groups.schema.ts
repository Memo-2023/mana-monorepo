import { pgTable, uuid, text, timestamp, varchar, integer, index } from 'drizzle-orm/pg-core';

/**
 * Event tag groups table - stores user-defined tag groups (e.g., Persons, Locations)
 */
export const eventTagGroups = pgTable(
	'event_tag_groups',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: varchar('name', { length: 100 }).notNull(),
		color: varchar('color', { length: 7 }).default('#3B82F6'),
		sortOrder: integer('sort_order').default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('event_tag_groups_user_idx').on(table.userId),
	})
);

export type EventTagGroup = typeof eventTagGroups.$inferSelect;
export type NewEventTagGroup = typeof eventTagGroups.$inferInsert;
