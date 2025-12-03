import {
	pgTable,
	uuid,
	varchar,
	text,
	timestamp,
	bigint,
	boolean,
	integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { folders } from './folders.schema';

export const files = pgTable('files', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: varchar('user_id', { length: 255 }).notNull(),

	// File metadata
	name: varchar('name', { length: 500 }).notNull(),
	originalName: varchar('original_name', { length: 500 }).notNull(),
	mimeType: varchar('mime_type', { length: 255 }).notNull(),
	size: bigint('size', { mode: 'number' }).notNull(),

	// Storage location
	storagePath: varchar('storage_path', { length: 1000 }).notNull(),
	storageKey: varchar('storage_key', { length: 500 }).notNull().unique(),

	// Hierarchy
	parentFolderId: uuid('parent_folder_id').references(() => folders.id, { onDelete: 'set null' }),

	// File properties
	checksum: varchar('checksum', { length: 64 }), // SHA-256
	thumbnailPath: varchar('thumbnail_path', { length: 500 }),

	// Versioning
	currentVersion: integer('current_version').default(1).notNull(),

	// Status flags
	isFavorite: boolean('is_favorite').default(false).notNull(),
	isDeleted: boolean('is_deleted').default(false).notNull(),
	deletedAt: timestamp('deleted_at', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const filesRelations = relations(files, ({ one }) => ({
	parentFolder: one(folders, {
		fields: [files.parentFolderId],
		references: [folders.id],
	}),
}));

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
