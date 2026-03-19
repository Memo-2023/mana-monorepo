import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTemplateDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(500)
	name: string;

	@IsString()
	@IsOptional()
	@MaxLength(500)
	description?: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(5000)
	systemPrompt: string;

	@IsString()
	@IsOptional()
	@MaxLength(5000)
	initialQuestion?: string;

	@IsString()
	@IsOptional()
	modelId?: string;

	@IsString()
	@IsOptional()
	color?: string;

	@IsBoolean()
	@IsOptional()
	documentMode?: boolean;
}

export class UpdateTemplateDto {
	@IsString()
	@IsOptional()
	@MaxLength(500)
	name?: string;

	@IsString()
	@IsOptional()
	@MaxLength(500)
	description?: string;

	@IsString()
	@IsOptional()
	@MaxLength(5000)
	systemPrompt?: string;

	@IsString()
	@IsOptional()
	@MaxLength(5000)
	initialQuestion?: string;

	@IsString()
	@IsOptional()
	modelId?: string;

	@IsString()
	@IsOptional()
	color?: string;

	@IsBoolean()
	@IsOptional()
	documentMode?: boolean;
}
