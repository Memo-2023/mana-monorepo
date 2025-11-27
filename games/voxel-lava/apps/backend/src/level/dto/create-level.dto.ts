import { IsString, IsOptional, IsBoolean, IsObject, IsArray } from 'class-validator';

export class CreateLevelDto {
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsObject()
	voxelData: Record<string, any>;

	@IsObject()
	spawnPoint: { x: number; y: number; z: number };

	@IsObject()
	worldSize: { width: number; height: number; depth: number };

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
