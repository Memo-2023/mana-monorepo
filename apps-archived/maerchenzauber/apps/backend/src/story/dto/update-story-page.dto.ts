import { IsString, IsInt, Min, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating a single story page's text content
 */
export class UpdateStoryPageTextDto {
	@IsInt()
	@Min(1)
	pageNumber: number;

	@IsString()
	@IsOptional()
	storyText?: string;

	@IsString()
	@IsOptional()
	storyTextGerman?: string;
}

/**
 * DTO for updating multiple story pages at once
 */
export class UpdateStoryPagesDto {
	@ValidateNested({ each: true })
	@Type(() => UpdateStoryPageTextDto)
	pages: UpdateStoryPageTextDto[];
}
