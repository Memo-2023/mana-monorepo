import { uuid, text, timestamp, boolean, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { users, authSchema } from './auth.schema';

/**
 * Custom Themes - Private themes created by users
 */
export const customThemes = authSchema.table(
	'custom_themes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),

		// Theme metadata
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🎨'),
		icon: text('icon').default('palette'),

		// Colors (JSONB - ThemeColors interface)
		lightColors: jsonb('light_colors').notNull(),
		darkColors: jsonb('dark_colors').notNull(),

		// Base variant this theme was derived from (optional)
		baseVariant: text('base_variant'), // 'lume' | 'nature' | 'stone' | 'ocean' | null

		// Publishing status
		isPublished: boolean('is_published').default(false).notNull(),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('custom_themes_user_idx').on(table.userId),
	})
);

/**
 * Community Themes - Public themes shared with all users
 */
export const communityThemes = authSchema.table(
	'community_themes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),

		// Theme metadata
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🎨'),
		icon: text('icon').default('palette'),

		// Colors (JSONB - ThemeColors interface)
		lightColors: jsonb('light_colors').notNull(),
		darkColors: jsonb('dark_colors').notNull(),

		// Base variant (for compatibility preview)
		baseVariant: text('base_variant'),

		// Statistics
		downloadCount: integer('download_count').default(0).notNull(),
		ratingSum: integer('rating_sum').default(0).notNull(),
		ratingCount: integer('rating_count').default(0).notNull(),

		// Moderation status: pending -> approved (or rejected), featured for promoted themes
		status: text('status').default('pending').notNull(), // 'pending' | 'approved' | 'rejected' | 'featured'
		isFeatured: boolean('is_featured').default(false).notNull(),

		// Tags for search/filtering
		tags: jsonb('tags').default([]).notNull(), // string[]

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
		publishedAt: timestamp('published_at', { withTimezone: true }),
	},
	(table) => ({
		authorIdx: index('community_themes_author_idx').on(table.authorId),
		statusIdx: index('community_themes_status_idx').on(table.status),
		downloadIdx: index('community_themes_download_idx').on(table.downloadCount),
		featuredIdx: index('community_themes_featured_idx').on(table.isFeatured),
	})
);

/**
 * User Theme Favorites - Users can favorite community themes
 */
export const userThemeFavorites = authSchema.table(
	'user_theme_favorites',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		communityThemeId: uuid('community_theme_id')
			.references(() => communityThemes.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userThemeIdx: index('user_theme_favorites_user_theme_idx').on(
			table.userId,
			table.communityThemeId
		),
	})
);

/**
 * User Theme Downloads - Track which users downloaded which themes
 */
export const userThemeDownloads = authSchema.table(
	'user_theme_downloads',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		communityThemeId: uuid('community_theme_id')
			.references(() => communityThemes.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userDownloadIdx: index('user_theme_downloads_user_theme_idx').on(
			table.userId,
			table.communityThemeId
		),
	})
);

/**
 * Theme Ratings - Users can rate community themes (1-5 stars)
 */
export const themeRatings = authSchema.table(
	'theme_ratings',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		communityThemeId: uuid('community_theme_id')
			.references(() => communityThemes.id, { onDelete: 'cascade' })
			.notNull(),
		rating: integer('rating').notNull(), // 1-5
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userRatingIdx: index('theme_ratings_user_theme_idx').on(table.userId, table.communityThemeId),
	})
);

// Type exports for use in services
export type CustomTheme = typeof customThemes.$inferSelect;
export type NewCustomTheme = typeof customThemes.$inferInsert;
export type CommunityTheme = typeof communityThemes.$inferSelect;
export type NewCommunityTheme = typeof communityThemes.$inferInsert;
export type UserThemeFavorite = typeof userThemeFavorites.$inferSelect;
export type UserThemeDownload = typeof userThemeDownloads.$inferSelect;
export type ThemeRating = typeof themeRatings.$inferSelect;
