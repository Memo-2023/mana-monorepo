import {
	IsString,
	IsOptional,
	IsBoolean,
	IsUUID,
	MinLength,
	MaxLength,
	IsNotEmpty,
} from 'class-validator';

export class CreateDeckDto {
	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	@MaxLength(200)
	title: string;

	@IsString()
	@IsOptional()
	@MaxLength(2000)
	description?: string;

	@IsUUID()
	@IsOptional()
	themeId?: string;
}

export class UpdateDeckDto {
	@IsString()
	@IsOptional()
	@MinLength(1)
	@MaxLength(200)
	title?: string;

	@IsString()
	@IsOptional()
	@MaxLength(2000)
	description?: string;

	@IsUUID()
	@IsOptional()
	themeId?: string;

	@IsBoolean()
	@IsOptional()
	isPublic?: boolean;
}
