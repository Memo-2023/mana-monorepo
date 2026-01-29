import { pgTable, uuid, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const collections = pgTable('collections', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),

	name: text('name').notNull(),
	description: text('description'),
	color: text('color').default('#6366f1'),
	icon: text('icon').default('folder'),

	isDefault: boolean('is_default').default(false),
	sortOrder: integer('sort_order').default(0),

	isShared: boolean('is_shared').default(false),
	shareToken: text('share_token').unique(),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
