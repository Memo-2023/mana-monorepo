import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetBoardsQueryDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includePublic?: boolean = false;
}

export class CreateBoardDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  canvasWidth?: number;

  @IsNumber()
  @IsOptional()
  canvasHeight?: number;

  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  canvasWidth?: number;

  @IsNumber()
  @IsOptional()
  canvasHeight?: number;

  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class GenerateThumbnailDto {
  @IsString()
  dataUrl: string;
}

export class ToggleVisibilityDto {
  @IsBoolean()
  isPublic: boolean;
}
