import { IsString, IsOptional, IsBoolean, IsObject, IsEnum } from 'class-validator';

export class UpdateFigureDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	subject?: string;

	@IsOptional()
	@IsEnum(['common', 'rare', 'epic', 'legendary'])
	rarity?: string;

	@IsOptional()
	@IsObject()
	characterInfo?: Record<string, any>;

	@IsOptional()
	@IsBoolean()
	isPublic?: boolean;

	@IsOptional()
	@IsBoolean()
	isArchived?: boolean;
}
