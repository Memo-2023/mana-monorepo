import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max, MaxLength } from 'class-validator';

export class GenerateImageDto {
	@IsString()
	@MaxLength(10000)
	prompt: string;

	@IsString()
	modelId: string;

	@IsString()
	@IsOptional()
	@MaxLength(500)
	modelVersion?: string;

	@IsString()
	@IsOptional()
	@MaxLength(10000)
	negativePrompt?: string;

	@IsNumber()
	@IsOptional()
	@Min(256)
	@Max(2048)
	width?: number;

	@IsNumber()
	@IsOptional()
	@Min(256)
	@Max(2048)
	height?: number;

	@IsNumber()
	@IsOptional()
	@Min(1)
	@Max(150)
	steps?: number;

	@IsNumber()
	@IsOptional()
	@Min(0)
	@Max(30)
	guidanceScale?: number;

	@IsNumber()
	@IsOptional()
	seed?: number;

	@IsString()
	@IsOptional()
	@MaxLength(2048)
	sourceImageUrl?: string;

	@IsNumber()
	@IsOptional()
	@Min(0)
	@Max(1)
	generationStrength?: number;

	@IsString()
	@IsOptional()
	@MaxLength(200)
	style?: string;

	@IsBoolean()
	@IsOptional()
	waitForResult?: boolean;
}
