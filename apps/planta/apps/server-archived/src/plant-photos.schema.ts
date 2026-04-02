import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { plants } from './plants.schema';

export const plantPhotos = pgTable('plant_photos', {
	id: uuid('id').primaryKey().defaultRandom(),
	plantId: uuid('plant_id').references(() => plants.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull(),

	// Storage
	storagePath: text('storage_path').notNull(),
	publicUrl: text('public_url'),
	filename: text('filename').notNull(),
	mimeType: text('mime_type'),
	fileSize: integer('file_size'),

	// Image metadata
	width: integer('width'),
	height: integer('height'),

	// Flags
	isPrimary: boolean('is_primary').default(false).notNull(),
	isAnalyzed: boolean('is_analyzed').default(false).notNull(),

	// Timestamps
	takenAt: timestamp('taken_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PlantPhoto = typeof plantPhotos.$inferSelect;
export type NewPlantPhoto = typeof plantPhotos.$inferInsert;
