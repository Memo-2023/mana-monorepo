import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetImagesQueryDto {
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
  archived?: boolean = false;

  @IsOptional()
  tagIds?: string | string[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  favoritesOnly?: boolean = false;
}

export class ToggleFavoriteDto {
  @IsBoolean()
  isFavorite: boolean;
}

export class BatchImageIdsDto {
  @IsArray()
  @IsString({ each: true })
  imageIds: string[];
}
