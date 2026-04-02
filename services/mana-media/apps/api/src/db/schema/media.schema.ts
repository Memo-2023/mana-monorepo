import {
	pgSchema,
	uuid,
	text,
	timestamp,
	integer,
	boolean,
	index,
	jsonb,
	bigint,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const mediaSchema = pgSchema('media');

/**
 * Core media table - stores unique files by content hash (SHA-256)
 * This is the Content-Addressable Storage (CAS) approach
 */
export const media = mediaSchema.table(
	'media',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		// Content-addressable: SHA-256 hash of the file content
		contentHash: text('content_hash').notNull().unique(),
		// Original filename (for display purposes)
		originalName: text('original_name'),
		// MIME type
		mimeType: text('mime_type').notNull(),
		// File size in bytes
		size: bigint('size', { mode: 'number' }).notNull(),
		// Storage keys
		originalKey: text('original_key').notNull(),
		// Processing status
		status: text('status', { enum: ['uploading', 'processing', 'ready', 'failed'] })
			.default('uploading')
			.notNull(),
		// Image metadata
		width: integer('width'),
		height: integer('height'),
		format: text('format'),
		hasAlpha: boolean('has_alpha'),
		// EXIF metadata
		exifData: jsonb('exif_data'),
		dateTaken: timestamp('date_taken', { withTimezone: true }),
		cameraMake: text('camera_make'),
		cameraModel: text('camera_model'),
		focalLength: text('focal_length'),
		aperture: text('aperture'),
		iso: integer('iso'),
		exposureTime: text('exposure_time'),
		gpsLatitude: text('gps_latitude'),
		gpsLongitude: text('gps_longitude'),
		// Generated variants
		thumbnailKey: text('thumbnail_key'),
		mediumKey: text('medium_key'),
		largeKey: text('large_key'),
		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('media_content_hash_idx').on(table.contentHash),
		index('media_status_idx').on(table.status),
		index('media_created_at_idx').on(table.createdAt),
		index('media_date_taken_idx').on(table.dateTaken),
		index('media_camera_idx').on(table.cameraMake, table.cameraModel),
	]
);

/**
 * Media references - tracks which user/app owns a reference to a media item
 * Multiple users can reference the same media (deduplication)
 */
export const mediaReferences = mediaSchema.table(
	'media_references',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		// The media being referenced
		mediaId: uuid('media_id')
			.references(() => media.id, { onDelete: 'cascade' })
			.notNull(),
		// Owner info (can be UUID or Matrix user ID like @user:matrix.org)
		userId: text('user_id').notNull(),
		// Source app (nutriphi, contacts, chat, etc.)
		app: text('app').notNull(),
		// Optional: reference to the source (e.g., mxc:// URL from Matrix)
		sourceUrl: text('source_url'),
		// Custom metadata per reference
		metadata: jsonb('metadata'),
		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('media_ref_media_id_idx').on(table.mediaId),
		index('media_ref_user_id_idx').on(table.userId),
		index('media_ref_app_idx').on(table.app),
		index('media_ref_user_app_idx').on(table.userId, table.app),
	]
);

/**
 * Lazy-generated thumbnails cache
 * Stores on-the-fly generated thumbnails with specific parameters
 */
export const mediaThumbnails = mediaSchema.table(
	'media_thumbnails',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		mediaId: uuid('media_id')
			.references(() => media.id, { onDelete: 'cascade' })
			.notNull(),
		// Parameters that define this thumbnail
		width: integer('width').notNull(),
		height: integer('height').notNull(),
		fit: text('fit').default('cover').notNull(),
		format: text('format').default('webp').notNull(),
		quality: integer('quality').default(80).notNull(),
		// Storage key for this specific thumbnail
		storageKey: text('storage_key').notNull(),
		// Size of the generated thumbnail
		size: integer('size').notNull(),
		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('media_thumb_media_id_idx').on(table.mediaId),
		index('media_thumb_params_idx').on(
			table.mediaId,
			table.width,
			table.height,
			table.fit,
			table.format
		),
	]
);

// Relations
export const mediaRelations = relations(media, ({ many }) => ({
	references: many(mediaReferences),
	thumbnails: many(mediaThumbnails),
}));

export const mediaReferencesRelations = relations(mediaReferences, ({ one }) => ({
	media: one(media, {
		fields: [mediaReferences.mediaId],
		references: [media.id],
	}),
}));

export const mediaThumbnailsRelations = relations(mediaThumbnails, ({ one }) => ({
	media: one(media, {
		fields: [mediaThumbnails.mediaId],
		references: [media.id],
	}),
}));

// Types
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type MediaReference = typeof mediaReferences.$inferSelect;
export type NewMediaReference = typeof mediaReferences.$inferInsert;
export type MediaThumbnail = typeof mediaThumbnails.$inferSelect;
export type NewMediaThumbnail = typeof mediaThumbnails.$inferInsert;
