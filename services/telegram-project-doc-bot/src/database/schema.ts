import {
	pgTable,
	uuid,
	text,
	timestamp,
	integer,
	bigint,
	jsonb,
	boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Projects table
export const projects = pgTable('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull(),
	name: text('name').notNull(),
	description: text('description'),
	status: text('status').default('active').notNull(), // active, archived, completed
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Media items (photos, voice notes, text)
export const mediaItems = pgTable('media_items', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.references(() => projects.id, { onDelete: 'cascade' })
		.notNull(),
	type: text('type').notNull(), // photo, voice, text

	// Storage
	storageKey: text('storage_key'), // S3 key for photo/voice
	thumbnailKey: text('thumbnail_key'), // Thumbnail for photos

	// Content
	caption: text('caption'), // Original caption/text
	transcription: text('transcription'), // Voice → Text
	aiDescription: text('ai_description'), // Vision → Description

	// Metadata
	metadata: jsonb('metadata').$type<{
		width?: number;
		height?: number;
		duration?: number;
		mimeType?: string;
		fileSize?: number;
	}>(),
	telegramFileId: text('telegram_file_id'),
	orderIndex: integer('order_index').default(0).notNull(),

	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Generated blog posts
export const generations = pgTable('generations', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.references(() => projects.id, { onDelete: 'cascade' })
		.notNull(),
	style: text('style').default('casual').notNull(),
	content: text('content').notNull(), // Generated markdown
	pdfKey: text('pdf_key'), // S3 key for PDF export
	isLatest: boolean('is_latest').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
	mediaItems: many(mediaItems),
	generations: many(generations),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one }) => ({
	project: one(projects, {
		fields: [mediaItems.projectId],
		references: [projects.id],
	}),
}));

export const generationsRelations = relations(generations, ({ one }) => ({
	project: one(projects, {
		fields: [generations.projectId],
		references: [projects.id],
	}),
}));

// Types
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type MediaItem = typeof mediaItems.$inferSelect;
export type NewMediaItem = typeof mediaItems.$inferInsert;
export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
