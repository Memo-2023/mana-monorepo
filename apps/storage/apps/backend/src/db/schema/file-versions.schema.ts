import { pgTable, uuid, varchar, timestamp, bigint, integer, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { files } from './files.schema';

export const fileVersions = pgTable('file_versions', {
	id: uuid('id').primaryKey().defaultRandom(),
	fileId: uuid('file_id')
		.references(() => files.id, { onDelete: 'cascade' })
		.notNull(),

	// Version info
	versionNumber: integer('version_number').notNull(),

	// Storage info for this version
	storagePath: varchar('storage_path', { length: 1000 }).notNull(),
	storageKey: varchar('storage_key', { length: 500 }).notNull(),
	size: bigint('size', { mode: 'number' }).notNull(),
	checksum: varchar('checksum', { length: 64 }),

	// Metadata
	comment: text('comment'), // Optional version comment
	createdBy: varchar('created_by', { length: 255 }).notNull(),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fileVersionsRelations = relations(fileVersions, ({ one }) => ({
	file: one(files, {
		fields: [fileVersions.fileId],
		references: [files.id],
	}),
}));

export type FileVersion = typeof fileVersions.$inferSelect;
export type NewFileVersion = typeof fileVersions.$inferInsert;
