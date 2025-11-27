import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const images = pgTable('images', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	generationId: uuid('generation_id'),
	sourceImageId: uuid('source_image_id'),

	prompt: text('prompt').notNull(),
	negativePrompt: text('negative_prompt'),
	model: text('model'),
	style: text('style'),

	publicUrl: text('public_url'),
	storagePath: text('storage_path').notNull(),
	filename: text('filename').notNull(),
	format: text('format'),

	width: integer('width'),
	height: integer('height'),
	fileSize: integer('file_size'),
	blurhash: text('blurhash'),

	isPublic: boolean('is_public').default(false).notNull(),
	isFavorite: boolean('is_favorite').default(false).notNull(),
	downloadCount: integer('download_count').default(0).notNull(),
	rating: integer('rating'),

	archivedAt: timestamp('archived_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
