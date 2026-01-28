import {
	IsString,
	IsOptional,
	IsArray,
	IsEnum,
	IsInt,
	Min,
	Max,
	IsBoolean,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchCategory {
	GENERAL = 'general',
	NEWS = 'news',
	SCIENCE = 'science',
	IT = 'it',
	IMAGES = 'images',
	VIDEOS = 'videos',
}

export enum TimeRange {
	DAY = 'day',
	WEEK = 'week',
	MONTH = 'month',
	YEAR = 'year',
}

export class SearchOptionsDto {
	@IsOptional()
	@IsArray()
	@IsEnum(SearchCategory, { each: true })
	categories?: SearchCategory[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	engines?: string[];

	@IsOptional()
	@IsString()
	language?: string;

	@IsOptional()
	@IsEnum(TimeRange)
	timeRange?: TimeRange;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(2)
	safeSearch?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(50)
	limit?: number;
}

export class CacheOptionsDto {
	@IsOptional()
	@IsBoolean()
	enabled?: boolean;

	@IsOptional()
	@IsInt()
	@Min(60)
	@Max(86400)
	ttl?: number;
}

export class SearchRequestDto {
	@IsString()
	query: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => SearchOptionsDto)
	options?: SearchOptionsDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => CacheOptionsDto)
	cache?: CacheOptionsDto;
}
