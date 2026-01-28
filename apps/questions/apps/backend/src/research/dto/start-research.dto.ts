import { IsUUID, IsOptional, IsEnum, IsArray, IsString, IsNumber } from 'class-validator';

export enum ResearchDepth {
	QUICK = 'quick', // 5-10 sources, fast
	STANDARD = 'standard', // 15-20 sources, balanced
	DEEP = 'deep', // 30+ sources, comprehensive
}

export enum SearchCategory {
	GENERAL = 'general',
	NEWS = 'news',
	SCIENCE = 'science',
	IT = 'it',
	IMAGES = 'images',
	VIDEOS = 'videos',
}

export class StartResearchDto {
	@IsUUID()
	questionId: string;

	@IsOptional()
	@IsEnum(ResearchDepth)
	depth?: ResearchDepth;

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
	@IsNumber()
	maxSources?: number;
}
