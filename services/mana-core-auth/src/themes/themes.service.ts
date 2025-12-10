import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, desc, ilike, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/connection';
import {
	customThemes,
	communityThemes,
	userThemeFavorites,
	userThemeDownloads,
	themeRatings,
	users,
} from '../db/schema';
import {
	CreateCustomThemeDto,
	UpdateCustomThemeDto,
	PublishThemeDto,
	ThemeQueryDto,
	CommunityThemeResponseDto,
	PaginatedCommunityThemesDto,
} from './dto';

@Injectable()
export class ThemesService {
	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	// ==================== Custom Themes ====================

	/**
	 * Create a new custom theme for a user
	 */
	async createCustomTheme(userId: string, dto: CreateCustomThemeDto) {
		const [theme] = await this.getDb()
			.insert(customThemes)
			.values({
				userId,
				name: dto.name,
				description: dto.description,
				emoji: dto.emoji || '🎨',
				icon: dto.icon || 'palette',
				lightColors: dto.lightColors,
				darkColors: dto.darkColors,
				baseVariant: dto.baseVariant,
			})
			.returning();

		return theme;
	}

	/**
	 * Get all custom themes for a user
	 */
	async getCustomThemes(userId: string) {
		return this.getDb()
			.select()
			.from(customThemes)
			.where(eq(customThemes.userId, userId))
			.orderBy(desc(customThemes.updatedAt));
	}

	/**
	 * Get a specific custom theme
	 */
	async getCustomTheme(userId: string, themeId: string) {
		const [theme] = await this.getDb()
			.select()
			.from(customThemes)
			.where(and(eq(customThemes.id, themeId), eq(customThemes.userId, userId)));

		if (!theme) {
			throw new NotFoundException('Theme not found');
		}

		return theme;
	}

	/**
	 * Update a custom theme
	 */
	async updateCustomTheme(userId: string, themeId: string, dto: UpdateCustomThemeDto) {
		// Verify ownership
		await this.getCustomTheme(userId, themeId);

		const [updated] = await this.getDb()
			.update(customThemes)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(customThemes.id, themeId), eq(customThemes.userId, userId)))
			.returning();

		return updated;
	}

	/**
	 * Delete a custom theme
	 */
	async deleteCustomTheme(userId: string, themeId: string) {
		// Verify ownership
		await this.getCustomTheme(userId, themeId);

		await this.getDb()
			.delete(customThemes)
			.where(and(eq(customThemes.id, themeId), eq(customThemes.userId, userId)));

		return { success: true };
	}

	/**
	 * Publish a custom theme to the community
	 */
	async publishTheme(userId: string, themeId: string, dto: PublishThemeDto) {
		const theme = await this.getCustomTheme(userId, themeId);

		if (theme.isPublished) {
			throw new ConflictException('Theme is already published');
		}

		// Create community theme entry (pending approval)
		const [communityTheme] = await this.getDb()
			.insert(communityThemes)
			.values({
				authorId: userId,
				name: theme.name,
				description: dto.description || theme.description,
				emoji: theme.emoji,
				icon: theme.icon,
				lightColors: theme.lightColors,
				darkColors: theme.darkColors,
				baseVariant: theme.baseVariant,
				tags: dto.tags || [],
				status: 'pending',
			})
			.returning();

		// Mark custom theme as published
		await this.getDb()
			.update(customThemes)
			.set({ isPublished: true, updatedAt: new Date() })
			.where(eq(customThemes.id, themeId));

		return communityTheme;
	}

	// ==================== Community Themes ====================

	/**
	 * Browse community themes with filtering and pagination
	 */
	async getCommunityThemes(
		query: ThemeQueryDto,
		userId?: string
	): Promise<PaginatedCommunityThemesDto> {
		const { page = 1, limit = 20, sort = 'popular', search, tags, authorId, featuredOnly } = query;
		const offset = (page - 1) * limit;

		// Build where conditions
		const conditions = [eq(communityThemes.status, 'approved')];

		if (featuredOnly) {
			conditions.push(eq(communityThemes.isFeatured, true));
		}

		if (authorId) {
			conditions.push(eq(communityThemes.authorId, authorId));
		}

		if (search) {
			conditions.push(ilike(communityThemes.name, `%${search}%`));
		}

		// Build order by
		let orderBy;
		switch (sort) {
			case 'recent':
				orderBy = desc(communityThemes.publishedAt);
				break;
			case 'rating':
				orderBy = desc(
					sql`CASE WHEN ${communityThemes.ratingCount} > 0 THEN ${communityThemes.ratingSum}::float / ${communityThemes.ratingCount} ELSE 0 END`
				);
				break;
			case 'downloads':
				orderBy = desc(communityThemes.downloadCount);
				break;
			case 'popular':
			default:
				// Popular = combination of downloads and rating
				orderBy = desc(
					sql`${communityThemes.downloadCount} + (CASE WHEN ${communityThemes.ratingCount} > 0 THEN ${communityThemes.ratingSum}::float / ${communityThemes.ratingCount} * 10 ELSE 0 END)`
				);
				break;
		}

		// Get themes with author info
		const themesQuery = this.getDb()
			.select({
				theme: communityThemes,
				authorName: users.name,
			})
			.from(communityThemes)
			.leftJoin(users, eq(communityThemes.authorId, users.id))
			.where(and(...conditions))
			.orderBy(orderBy)
			.limit(limit)
			.offset(offset);

		const themes = await themesQuery;

		// Get total count
		const [{ count }] = await this.getDb()
			.select({ count: sql<number>`count(*)` })
			.from(communityThemes)
			.where(and(...conditions));

		// If user is authenticated, get their favorites, downloads, and ratings
		let userFavorites = new Set<string>();
		let userDownloads = new Set<string>();
		let userRatingsMap = new Map<string, number>();

		if (userId) {
			const themeIds = themes.map((t) => t.theme.id);

			if (themeIds.length > 0) {
				const favorites = await this.getDb()
					.select()
					.from(userThemeFavorites)
					.where(
						and(
							eq(userThemeFavorites.userId, userId),
							inArray(userThemeFavorites.communityThemeId, themeIds)
						)
					);
				userFavorites = new Set(favorites.map((f) => f.communityThemeId));

				const downloads = await this.getDb()
					.select()
					.from(userThemeDownloads)
					.where(
						and(
							eq(userThemeDownloads.userId, userId),
							inArray(userThemeDownloads.communityThemeId, themeIds)
						)
					);
				userDownloads = new Set(downloads.map((d) => d.communityThemeId));

				const ratings = await this.getDb()
					.select()
					.from(themeRatings)
					.where(
						and(eq(themeRatings.userId, userId), inArray(themeRatings.communityThemeId, themeIds))
					);
				ratings.forEach((r) => userRatingsMap.set(r.communityThemeId, r.rating));
			}
		}

		// Transform to response DTOs
		const responseThemes: CommunityThemeResponseDto[] = themes.map(({ theme, authorName }) => ({
			id: theme.id,
			authorId: theme.authorId ?? undefined,
			authorName: authorName || undefined,
			name: theme.name,
			description: theme.description || undefined,
			emoji: theme.emoji || '🎨',
			icon: theme.icon || 'palette',
			lightColors: theme.lightColors as any,
			darkColors: theme.darkColors as any,
			baseVariant: theme.baseVariant || undefined,
			downloadCount: theme.downloadCount,
			averageRating: theme.ratingCount > 0 ? theme.ratingSum / theme.ratingCount : 0,
			ratingCount: theme.ratingCount,
			status: theme.status,
			isFeatured: theme.isFeatured,
			tags: (theme.tags as string[]) || [],
			createdAt: theme.createdAt,
			publishedAt: theme.publishedAt || undefined,
			isFavorited: userFavorites.has(theme.id),
			isDownloaded: userDownloads.has(theme.id),
			userRating: userRatingsMap.get(theme.id),
		}));

		return {
			themes: responseThemes,
			total: Number(count),
			page,
			limit,
			totalPages: Math.ceil(Number(count) / limit),
		};
	}

	/**
	 * Get a specific community theme
	 */
	async getCommunityTheme(themeId: string, userId?: string): Promise<CommunityThemeResponseDto> {
		const [result] = await this.getDb()
			.select({
				theme: communityThemes,
				authorName: users.name,
			})
			.from(communityThemes)
			.leftJoin(users, eq(communityThemes.authorId, users.id))
			.where(eq(communityThemes.id, themeId));

		if (!result) {
			throw new NotFoundException('Theme not found');
		}

		const { theme, authorName } = result;

		// Get user-specific data if authenticated
		let isFavorited = false;
		let isDownloaded = false;
		let userRating: number | undefined;

		if (userId) {
			const [favorite] = await this.getDb()
				.select()
				.from(userThemeFavorites)
				.where(
					and(
						eq(userThemeFavorites.userId, userId),
						eq(userThemeFavorites.communityThemeId, themeId)
					)
				);
			isFavorited = !!favorite;

			const [download] = await this.getDb()
				.select()
				.from(userThemeDownloads)
				.where(
					and(
						eq(userThemeDownloads.userId, userId),
						eq(userThemeDownloads.communityThemeId, themeId)
					)
				);
			isDownloaded = !!download;

			const [rating] = await this.getDb()
				.select()
				.from(themeRatings)
				.where(and(eq(themeRatings.userId, userId), eq(themeRatings.communityThemeId, themeId)));
			userRating = rating?.rating;
		}

		return {
			id: theme.id,
			authorId: theme.authorId ?? undefined,
			authorName: authorName || undefined,
			name: theme.name,
			description: theme.description || undefined,
			emoji: theme.emoji || '🎨',
			icon: theme.icon || 'palette',
			lightColors: theme.lightColors as any,
			darkColors: theme.darkColors as any,
			baseVariant: theme.baseVariant || undefined,
			downloadCount: theme.downloadCount,
			averageRating: theme.ratingCount > 0 ? theme.ratingSum / theme.ratingCount : 0,
			ratingCount: theme.ratingCount,
			status: theme.status,
			isFeatured: theme.isFeatured,
			tags: (theme.tags as string[]) || [],
			createdAt: theme.createdAt,
			publishedAt: theme.publishedAt || undefined,
			isFavorited,
			isDownloaded,
			userRating,
		};
	}

	/**
	 * Download/install a community theme
	 */
	async downloadTheme(userId: string, themeId: string) {
		const theme = await this.getCommunityTheme(themeId);

		if (theme.status !== 'approved' && theme.status !== 'featured') {
			throw new ForbiddenException('Theme is not available for download');
		}

		// Check if already downloaded
		const [existing] = await this.getDb()
			.select()
			.from(userThemeDownloads)
			.where(
				and(eq(userThemeDownloads.userId, userId), eq(userThemeDownloads.communityThemeId, themeId))
			);

		if (!existing) {
			// Record download
			await this.getDb().insert(userThemeDownloads).values({
				userId,
				communityThemeId: themeId,
			});

			// Increment download count
			await this.getDb()
				.update(communityThemes)
				.set({
					downloadCount: sql`${communityThemes.downloadCount} + 1`,
				})
				.where(eq(communityThemes.id, themeId));
		}

		// Return the theme data for the user to apply
		return theme;
	}

	/**
	 * Rate a community theme
	 */
	async rateTheme(userId: string, themeId: string, rating: number) {
		const theme = await this.getCommunityTheme(themeId);

		// Check for existing rating
		const [existingRating] = await this.getDb()
			.select()
			.from(themeRatings)
			.where(and(eq(themeRatings.userId, userId), eq(themeRatings.communityThemeId, themeId)));

		if (existingRating) {
			// Update existing rating
			const ratingDiff = rating - existingRating.rating;

			await this.getDb()
				.update(themeRatings)
				.set({ rating, updatedAt: new Date() })
				.where(eq(themeRatings.id, existingRating.id));

			await this.getDb()
				.update(communityThemes)
				.set({
					ratingSum: sql`${communityThemes.ratingSum} + ${ratingDiff}`,
				})
				.where(eq(communityThemes.id, themeId));
		} else {
			// Create new rating
			await this.getDb().insert(themeRatings).values({
				userId,
				communityThemeId: themeId,
				rating,
			});

			await this.getDb()
				.update(communityThemes)
				.set({
					ratingSum: sql`${communityThemes.ratingSum} + ${rating}`,
					ratingCount: sql`${communityThemes.ratingCount} + 1`,
				})
				.where(eq(communityThemes.id, themeId));
		}

		// Get updated theme to return new stats
		const [updatedTheme] = await this.getDb()
			.select()
			.from(communityThemes)
			.where(eq(communityThemes.id, themeId));

		return {
			averageRating:
				updatedTheme.ratingCount > 0 ? updatedTheme.ratingSum / updatedTheme.ratingCount : 0,
			ratingCount: updatedTheme.ratingCount,
		};
	}

	/**
	 * Toggle favorite status for a community theme
	 */
	async toggleFavorite(userId: string, themeId: string) {
		// Verify theme exists
		await this.getCommunityTheme(themeId);

		const [existing] = await this.getDb()
			.select()
			.from(userThemeFavorites)
			.where(
				and(eq(userThemeFavorites.userId, userId), eq(userThemeFavorites.communityThemeId, themeId))
			);

		if (existing) {
			// Remove favorite
			await this.getDb().delete(userThemeFavorites).where(eq(userThemeFavorites.id, existing.id));
			return { isFavorited: false };
		} else {
			// Add favorite
			await this.getDb().insert(userThemeFavorites).values({
				userId,
				communityThemeId: themeId,
			});
			return { isFavorited: true };
		}
	}

	/**
	 * Get user's favorite themes
	 */
	async getFavorites(userId: string) {
		const favorites = await this.getDb()
			.select({
				theme: communityThemes,
				authorName: users.name,
			})
			.from(userThemeFavorites)
			.innerJoin(communityThemes, eq(userThemeFavorites.communityThemeId, communityThemes.id))
			.leftJoin(users, eq(communityThemes.authorId, users.id))
			.where(eq(userThemeFavorites.userId, userId))
			.orderBy(desc(userThemeFavorites.createdAt));

		return favorites.map(({ theme, authorName }) => ({
			id: theme.id,
			authorId: theme.authorId,
			authorName: authorName || undefined,
			name: theme.name,
			description: theme.description || undefined,
			emoji: theme.emoji || '🎨',
			icon: theme.icon || 'palette',
			lightColors: theme.lightColors,
			darkColors: theme.darkColors,
			baseVariant: theme.baseVariant || undefined,
			downloadCount: theme.downloadCount,
			averageRating: theme.ratingCount > 0 ? theme.ratingSum / theme.ratingCount : 0,
			ratingCount: theme.ratingCount,
			status: theme.status,
			isFeatured: theme.isFeatured,
			tags: (theme.tags as string[]) || [],
			createdAt: theme.createdAt,
			publishedAt: theme.publishedAt || undefined,
			isFavorited: true,
		}));
	}

	/**
	 * Get user's downloaded themes
	 */
	async getDownloadedThemes(userId: string) {
		const downloads = await this.getDb()
			.select({
				theme: communityThemes,
				authorName: users.name,
			})
			.from(userThemeDownloads)
			.innerJoin(communityThemes, eq(userThemeDownloads.communityThemeId, communityThemes.id))
			.leftJoin(users, eq(communityThemes.authorId, users.id))
			.where(eq(userThemeDownloads.userId, userId))
			.orderBy(desc(userThemeDownloads.createdAt));

		return downloads.map(({ theme, authorName }) => ({
			id: theme.id,
			authorId: theme.authorId,
			authorName: authorName || undefined,
			name: theme.name,
			description: theme.description || undefined,
			emoji: theme.emoji || '🎨',
			icon: theme.icon || 'palette',
			lightColors: theme.lightColors,
			darkColors: theme.darkColors,
			baseVariant: theme.baseVariant || undefined,
			downloadCount: theme.downloadCount,
			averageRating: theme.ratingCount > 0 ? theme.ratingSum / theme.ratingCount : 0,
			ratingCount: theme.ratingCount,
			status: theme.status,
			isFeatured: theme.isFeatured,
			tags: (theme.tags as string[]) || [],
			createdAt: theme.createdAt,
			publishedAt: theme.publishedAt || undefined,
			isDownloaded: true,
		}));
	}
}
