import { IsString, IsOptional, IsBoolean, MaxLength, IsObject } from 'class-validator';
import type { ProjectSettings } from '../../db/schema/projects.schema';

export class CreateProjectDto {
	@IsString()
	@MaxLength(255)
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	@MaxLength(7)
	color?: string;

	@IsOptional()
	@IsString()
	@MaxLength(50)
	icon?: string;

	@IsOptional()
	@IsBoolean()
	isDefault?: boolean;

	@IsOptional()
	@IsObject()
	settings?: ProjectSettings;
}
