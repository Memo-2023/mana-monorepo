import { pgTable, uuid, timestamp, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { emailAccounts } from './email-accounts.schema';

export const folders = pgTable('folders', {
	id: uuid('id').primaryKey().defaultRandom(),
	accountId: uuid('account_id')
		.references(() => emailAccounts.id, { onDelete: 'cascade' })
		.notNull(),
	userId: varchar('user_id', { length: 255 }).notNull(),

	name: varchar('name', { length: 255 }).notNull(),
	type: varchar('type', { length: 50 }).notNull(), // inbox, sent, drafts, trash, spam, archive, custom
	path: varchar('path', { length: 500 }).notNull(), // IMAP folder path
	color: varchar('color', { length: 7 }),
	icon: varchar('icon', { length: 50 }),

	// Provider-specific ID
	externalId: varchar('external_id', { length: 255 }),

	// Counts (cached)
	totalCount: integer('total_count').default(0),
	unreadCount: integer('unread_count').default(0),

	// Flags
	isSystem: boolean('is_system').default(false),
	isHidden: boolean('is_hidden').default(false),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
