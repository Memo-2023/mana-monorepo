import { IsString, IsOptional, IsBoolean, IsObject, IsEnum } from 'class-validator';

export class CreateFigureDto {
	@IsString()
	name: string;

	@IsString()
	subject: string;

	@IsString()
	imageUrl: string;

	@IsOptional()
	@IsString()
	enhancedPrompt?: string;

	@IsOptional()
	@IsEnum(['common', 'rare', 'epic', 'legendary'])
	rarity?: string;

	@IsOptional()
	@IsObject()
	characterInfo?: Record<string, any>;

	@IsOptional()
	@IsBoolean()
	isPublic?: boolean;
}
