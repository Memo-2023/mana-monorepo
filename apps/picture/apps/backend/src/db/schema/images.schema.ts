import { pgTable, uuid, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';

export const images = pgTable(
	'images',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
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
	},
	(table) => ({
		userIdIdx: index('images_user_id_idx').on(table.userId),
		isPublicIdx: index('images_is_public_idx').on(table.isPublic),
		createdAtIdx: index('images_created_at_idx').on(table.createdAt),
		generationIdIdx: index('images_generation_id_idx').on(table.generationId),
		sourceImageIdIdx: index('images_source_image_id_idx').on(table.sourceImageId),
	})
);

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
