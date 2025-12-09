import { pgTable, uuid, text, timestamp, varchar, index } from 'drizzle-orm/pg-core';

export const labels = pgTable(
	'labels',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: varchar('name', { length: 100 }).notNull(),
		color: varchar('color', { length: 7 }).default('#6B7280'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('labels_user_idx').on(table.userId),
	})
);

export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;
