import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class ArtifactDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;
}

export class GenerateFigureDto {
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	characterDescription?: string;

	@IsOptional()
	@IsEnum(['common', 'rare', 'epic', 'legendary'])
	rarity?: string;

	@IsOptional()
	@IsString()
	characterImage?: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ArtifactDto)
	artifacts?: ArtifactDto[];

	@IsOptional()
	@IsBoolean()
	isPublic?: boolean;
}
