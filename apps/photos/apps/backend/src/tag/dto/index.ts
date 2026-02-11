import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

export class CreateTagDto {
	@IsString()
	@MaxLength(50)
	name: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	color?: string;
}

export class UpdateTagDto {
	@IsOptional()
	@IsString()
	@MaxLength(50)
	name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	color?: string;
}

export class SetTagsDto {
	@IsArray()
	@IsString({ each: true })
	tagIds: string[];
}
