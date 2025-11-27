import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchPromptDto {
	@IsString()
	text: string;

	@IsString()
	@IsOptional()
	negativePrompt?: string;

	@IsNumber()
	@IsOptional()
	seed?: number;

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	tags?: string[];
}

export class SharedSettingsDto {
	@IsUUID()
	modelId: string;

	@IsString()
	modelVersion: string;

	@IsNumber()
	width: number;

	@IsNumber()
	height: number;

	@IsNumber()
	steps: number;

	@IsNumber()
	guidanceScale: number;
}

export class CreateBatchDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => BatchPromptDto)
	prompts: BatchPromptDto[];

	@ValidateNested()
	@Type(() => SharedSettingsDto)
	sharedSettings: SharedSettingsDto;

	@IsString()
	@IsOptional()
	batchName?: string;
}

export class GetBatchQueryDto {
	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	page?: number = 1;

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	limit?: number = 20;
}
