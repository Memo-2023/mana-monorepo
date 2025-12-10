import {
	IsString,
	IsOptional,
	IsObject,
	IsBoolean,
	IsArray,
	IsInt,
	Min,
	Max,
	IsEnum,
	IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * ThemeColors structure matching the frontend ThemeColors interface
 */
export class ThemeColorsDto {
	@IsString()
	primary: string;

	@IsString()
	@IsOptional()
	primaryForeground?: string;

	@IsString()
	background: string;

	@IsString()
	foreground: string;

	@IsString()
	surface: string;

	@IsString()
	@IsOptional()
	surfaceHover?: string;

	@IsString()
	@IsOptional()
	surfaceElevated?: string;

	@IsString()
	@IsOptional()
	muted?: string;

	@IsString()
	@IsOptional()
	mutedForeground?: string;

	@IsString()
	@IsOptional()
	border?: string;

	@IsString()
	@IsOptional()
	borderStrong?: string;

	@IsString()
	@IsOptional()
	secondary?: string;

	@IsString()
	@IsOptional()
	secondaryForeground?: string;

	@IsString()
	@IsOptional()
	input?: string;

	@IsString()
	@IsOptional()
	ring?: string;

	@IsString()
	error: string;

	@IsString()
	success: string;

	@IsString()
	warning: string;
}

/**
 * Create a new custom theme
 */
export class CreateCustomThemeDto {
	@IsString()
	name: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsString()
	@IsOptional()
	emoji?: string;

	@IsString()
	@IsOptional()
	icon?: string;

	@IsObject()
	@Type(() => ThemeColorsDto)
	lightColors: ThemeColorsDto;

	@IsObject()
	@Type(() => ThemeColorsDto)
	darkColors: ThemeColorsDto;

	@IsString()
	@IsOptional()
	@IsEnum(['lume', 'nature', 'stone', 'ocean'])
	baseVariant?: 'lume' | 'nature' | 'stone' | 'ocean';
}

/**
 * Update an existing custom theme
 */
export class UpdateCustomThemeDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsString()
	@IsOptional()
	emoji?: string;

	@IsString()
	@IsOptional()
	icon?: string;

	@IsObject()
	@IsOptional()
	@Type(() => ThemeColorsDto)
	lightColors?: ThemeColorsDto;

	@IsObject()
	@IsOptional()
	@Type(() => ThemeColorsDto)
	darkColors?: ThemeColorsDto;

	@IsString()
	@IsOptional()
	@IsEnum(['lume', 'nature', 'stone', 'ocean'])
	baseVariant?: 'lume' | 'nature' | 'stone' | 'ocean';
}

/**
 * Publish a custom theme to the community
 */
export class PublishThemeDto {
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	tags?: string[];

	@IsString()
	@IsOptional()
	description?: string;
}

/**
 * Query parameters for browsing community themes
 */
export class ThemeQueryDto {
	@IsInt()
	@Min(1)
	@IsOptional()
	@Type(() => Number)
	page?: number = 1;

	@IsInt()
	@Min(1)
	@Max(100)
	@IsOptional()
	@Type(() => Number)
	limit?: number = 20;

	@IsString()
	@IsOptional()
	@IsEnum(['popular', 'recent', 'rating', 'downloads'])
	sort?: 'popular' | 'recent' | 'rating' | 'downloads' = 'popular';

	@IsString()
	@IsOptional()
	search?: string;

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	tags?: string[];

	@IsString()
	@IsOptional()
	authorId?: string;

	@IsBoolean()
	@IsOptional()
	@Type(() => Boolean)
	featuredOnly?: boolean;
}

/**
 * Rate a community theme
 */
export class RateThemeDto {
	@IsInt()
	@Min(1)
	@Max(5)
	rating: number;
}

/**
 * Response for a custom theme
 */
export class CustomThemeResponseDto {
	id: string;
	userId: string;
	name: string;
	description?: string;
	emoji: string;
	icon: string;
	lightColors: ThemeColorsDto;
	darkColors: ThemeColorsDto;
	baseVariant?: string;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Response for a community theme
 */
export class CommunityThemeResponseDto {
	id: string;
	authorId?: string;
	authorName?: string;
	name: string;
	description?: string;
	emoji: string;
	icon: string;
	lightColors: ThemeColorsDto;
	darkColors: ThemeColorsDto;
	baseVariant?: string;
	downloadCount: number;
	averageRating: number;
	ratingCount: number;
	status: string;
	isFeatured: boolean;
	tags: string[];
	createdAt: Date;
	publishedAt?: Date;
	// User-specific fields (when authenticated)
	isFavorited?: boolean;
	isDownloaded?: boolean;
	userRating?: number;
}

/**
 * Paginated response for community themes
 */
export class PaginatedCommunityThemesDto {
	themes: CommunityThemeResponseDto[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
