import { pgTable, uuid, text, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { images } from './images.schema';

export const imageLikes = pgTable(
	'image_likes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		imageId: uuid('image_id')
			.notNull()
			.references(() => images.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		uniqueImageUser: unique('unique_image_user').on(table.imageId, table.userId),
		imageIdIdx: index('image_likes_image_id_idx').on(table.imageId),
	})
);

export type ImageLike = typeof imageLikes.$inferSelect;
export type NewImageLike = typeof imageLikes.$inferInsert;
