import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateDeckDto {
	@IsString()
	title: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsUUID()
	@IsOptional()
	themeId?: string;
}

export class UpdateDeckDto {
	@IsString()
	@IsOptional()
	title?: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsUUID()
	@IsOptional()
	themeId?: string;

	@IsBoolean()
	@IsOptional()
	isPublic?: boolean;
}
