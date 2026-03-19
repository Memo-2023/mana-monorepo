import { pgTable, uuid, text, timestamp, varchar, real, boolean } from 'drizzle-orm/pg-core';

/**
 * Library beats are free beats available to all users.
 * They are pre-uploaded by admins and can be used in any project.
 */
export const libraryBeats = pgTable('library_beats', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: varchar('title', { length: 255 }).notNull(),
	artist: varchar('artist', { length: 255 }),
	genre: varchar('genre', { length: 100 }),
	bpm: real('bpm'),
	duration: real('duration'),
	storagePath: text('storage_path').notNull(),
	previewUrl: text('preview_url'),
	license: varchar('license', { length: 100 }).default('free'),
	isActive: boolean('is_active').default(true),
	tags: text('tags').array(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type LibraryBeat = typeof libraryBeats.$inferSelect;
export type NewLibraryBeat = typeof libraryBeats.$inferInsert;
