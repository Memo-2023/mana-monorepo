import { pgTable, uuid, varchar, timestamp, boolean, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const folders = pgTable('folders', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: varchar('user_id', { length: 255 }).notNull(),

	// Folder metadata
	name: varchar('name', { length: 255 }).notNull(),
	color: varchar('color', { length: 20 }),
	description: text('description'),

	// Hierarchy (self-referencing)
	parentFolderId: uuid('parent_folder_id'),

	// Path for efficient queries (e.g., "/root-uuid/parent-uuid/current-uuid")
	path: text('path').notNull(),
	depth: integer('depth').default(0).notNull(),

	// Status flags
	isFavorite: boolean('is_favorite').default(false).notNull(),
	isDeleted: boolean('is_deleted').default(false).notNull(),
	deletedAt: timestamp('deleted_at', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Self-referencing relation
export const foldersRelations = relations(folders, ({ one, many }) => ({
	parentFolder: one(folders, {
		fields: [folders.parentFolderId],
		references: [folders.id],
		relationName: 'folder_parent',
	}),
	childFolders: many(folders, { relationName: 'folder_parent' }),
}));

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
