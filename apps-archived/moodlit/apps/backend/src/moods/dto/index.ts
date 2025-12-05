import { IsString, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class CreateMoodDto {
	@IsString()
	name: string;

	@IsArray()
	@IsString({ each: true })
	colors: string[];

	@IsString()
	@IsOptional()
	animation?: string;

	@IsBoolean()
	@IsOptional()
	isDefault?: boolean;
}

export class UpdateMoodDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	colors?: string[];

	@IsString()
	@IsOptional()
	animation?: string;

	@IsBoolean()
	@IsOptional()
	isDefault?: boolean;
}
