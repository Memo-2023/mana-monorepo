import {
	IsString,
	IsUrl,
	IsOptional,
	IsInt,
	IsBoolean,
	IsArray,
	Min,
	Max,
	ValidateNested,
	IsObject,
	IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrawlSelectorsDto {
	@IsOptional()
	@IsString()
	title?: string;

	@IsOptional()
	@IsString()
	content?: string;

	@IsOptional()
	@IsString()
	links?: string;

	@IsOptional()
	@IsObject()
	custom?: Record<string, string>;
}

export class CrawlOutputDto {
	@IsOptional()
	@IsEnum(['text', 'html', 'markdown'])
	format?: 'text' | 'html' | 'markdown';
}

export class CrawlConfigDto {
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(10)
	maxDepth?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(10000)
	maxPages?: number;

	@IsOptional()
	@IsBoolean()
	respectRobots?: boolean;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	rateLimit?: number;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	includePatterns?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	excludePatterns?: string[];

	@IsOptional()
	@ValidateNested()
	@Type(() => CrawlSelectorsDto)
	selectors?: CrawlSelectorsDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => CrawlOutputDto)
	output?: CrawlOutputDto;
}

export class StartCrawlDto {
	@IsUrl()
	startUrl: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => CrawlConfigDto)
	config?: CrawlConfigDto;

	@IsOptional()
	@IsUrl()
	webhookUrl?: string;
}
