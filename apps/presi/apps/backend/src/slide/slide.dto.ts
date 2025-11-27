import { IsObject, IsOptional, IsNumber, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class SlideContent {
  type: 'title' | 'content' | 'image' | 'split';
  title?: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  bulletPoints?: string[];
}

export class CreateSlideDto {
  @IsObject()
  content: SlideContent;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateSlideDto {
  @IsObject()
  @IsOptional()
  content?: SlideContent;

  @IsNumber()
  @IsOptional()
  order?: number;
}

class SlideOrderItem {
  @IsUUID()
  id: string;

  @IsNumber()
  order: number;
}

export class ReorderSlidesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlideOrderItem)
  slides: SlideOrderItem[];
}
