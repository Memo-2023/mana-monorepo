import { IsString, IsOptional, IsNumber } from 'class-validator';

export class GenerateImageDto {
  @IsString()
  prompt: string;

  @IsString()
  modelId: string;

  @IsString()
  @IsOptional()
  negativePrompt?: string;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  steps?: number;

  @IsNumber()
  @IsOptional()
  guidanceScale?: number;

  @IsNumber()
  @IsOptional()
  seed?: number;

  @IsString()
  @IsOptional()
  sourceImageUrl?: string;

  @IsNumber()
  @IsOptional()
  generationStrength?: number;
}
