import {
	IsString,
	IsOptional,
	IsBoolean,
	MaxLength,
	MinLength,
	IsObject,
	IsNotEmpty,
} from 'class-validator';
import type { ProjectSettings } from '../../db/schema/projects.schema';

export class CreateProjectDto {
	@IsString()
	@IsNotEmpty({ message: 'Name darf nicht leer sein' })
	@MinLength(1, { message: 'Name muss mindestens 1 Zeichen haben' })
	@MaxLength(255, { message: 'Name darf maximal 255 Zeichen haben' })
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
