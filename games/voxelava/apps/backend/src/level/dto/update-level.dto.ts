import { IsString, IsOptional, IsBoolean, IsObject, IsArray } from 'class-validator';

export class UpdateLevelDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsObject()
	voxelData?: Record<string, any>;

	@IsOptional()
	@IsObject()
	spawnPoint?: { x: number; y: number; z: number };

	@IsOptional()
	@IsObject()
	worldSize?: { width: number; height: number; depth: number };

	@IsOptional()
	@IsBoolean()
	isPublic?: boolean;

	@IsOptional()
	@IsString()
	difficulty?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tags?: string[];

	@IsOptional()
	@IsString()
	thumbnailUrl?: string;
}
