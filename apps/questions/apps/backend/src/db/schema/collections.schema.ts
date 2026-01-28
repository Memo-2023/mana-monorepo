import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const collections = pgTable('collections', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),

	name: text('name').notNull(),
	description: text('description'),
	color: text('color').default('#6366f1'),
	icon: text('icon').default('folder'),

	isShared: boolean('is_shared').default(false),
	shareToken: text('share_token').unique(),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
