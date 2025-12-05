import { pgTable, uuid, timestamp, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { emails } from './emails.schema';

export const attachments = pgTable('attachments', {
	id: uuid('id').primaryKey().defaultRandom(),
	emailId: uuid('email_id')
		.references(() => emails.id, { onDelete: 'cascade' })
		.notNull(),
	userId: varchar('user_id', { length: 255 }).notNull(),

	filename: varchar('filename', { length: 500 }).notNull(),
	mimeType: varchar('mime_type', { length: 255 }).notNull(),
	size: integer('size').notNull(),
	contentId: varchar('content_id', { length: 255 }), // For inline images

	// Storage
	storageKey: varchar('storage_key', { length: 500 }),
	storageUrl: varchar('storage_url', { length: 1000 }),
	isDownloaded: boolean('is_downloaded').default(false),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
