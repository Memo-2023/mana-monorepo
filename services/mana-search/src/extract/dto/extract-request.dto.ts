import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsUrl, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class ExtractOptionsDto {
	@IsOptional()
	@IsBoolean()
	includeHtml?: boolean;

	@IsOptional()
	@IsBoolean()
	includeMarkdown?: boolean;

	@IsOptional()
	@IsInt()
	@Min(100)
	@Max(100000)
	maxLength?: number;

	@IsOptional()
	@IsBoolean()
	extractImages?: boolean;

	@IsOptional()
	@IsBoolean()
	extractLinks?: boolean;

	@IsOptional()
	@IsInt()
	@Min(1000)
	@Max(30000)
	timeout?: number;
}

export class ExtractRequestDto {
	@IsString()
	@IsUrl()
	url: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => ExtractOptionsDto)
	options?: ExtractOptionsDto;
}

export class BulkExtractRequestDto {
	@IsArray()
	@IsUrl({}, { each: true })
	urls: string[];

	@IsOptional()
	@ValidateNested()
	@Type(() => ExtractOptionsDto)
	options?: ExtractOptionsDto;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(10)
	concurrency?: number;
}
