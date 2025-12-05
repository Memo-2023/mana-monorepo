import { pgTable, uuid, varchar, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { files } from './files.schema';
import { folders } from './folders.schema';

export const shareTypeEnum = pgEnum('share_type', ['file', 'folder']);
export const shareAccessEnum = pgEnum('share_access', ['view', 'edit', 'download']);

export const shares = pgTable('shares', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: varchar('user_id', { length: 255 }).notNull(), // Owner

	// Share target (one of these will be set)
	fileId: uuid('file_id').references(() => files.id, { onDelete: 'cascade' }),
	folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
	shareType: shareTypeEnum('share_type').notNull(),

	// Share link
	shareToken: varchar('share_token', { length: 64 }).notNull().unique(),
	accessLevel: shareAccessEnum('access_level').default('view').notNull(),

	// Security
	password: varchar('password', { length: 255 }), // Hashed password
	maxDownloads: integer('max_downloads'),
	downloadCount: integer('download_count').default(0).notNull(),

	// Expiration
	expiresAt: timestamp('expires_at', { withTimezone: true }),

	// Status
	isActive: boolean('is_active').default(true).notNull(),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
});

export const sharesRelations = relations(shares, ({ one }) => ({
	file: one(files, {
		fields: [shares.fileId],
		references: [files.id],
	}),
	folder: one(folders, {
		fields: [shares.folderId],
		references: [folders.id],
	}),
}));

export type Share = typeof shares.$inferSelect;
export type NewShare = typeof shares.$inferInsert;
