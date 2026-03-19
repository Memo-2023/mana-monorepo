import {
	IsOptional,
	IsNumber,
	IsArray,
	ValidateNested,
	IsUUID,
	IsIn,
	IsString,
	IsUrl,
	MaxLength,
	Min,
	IsInt,
	ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class SlideContent {
	@IsIn(['title', 'content', 'image', 'split'])
	type: 'title' | 'content' | 'image' | 'split';

	@IsString()
	@IsOptional()
	@MaxLength(500)
	title?: string;

	@IsString()
	@IsOptional()
	@MaxLength(500)
	subtitle?: string;

	@IsString()
	@IsOptional()
	@MaxLength(5000)
	body?: string;

	@IsUrl()
	@IsOptional()
	imageUrl?: string;

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	@ArrayMaxSize(50)
	bulletPoints?: string[];
}

export class CreateSlideDto {
	@ValidateNested()
	@Type(() => SlideContent)
	content: SlideContent;

	@IsInt()
	@Min(0)
	@IsOptional()
	order?: number;
}

export class UpdateSlideDto {
	@ValidateNested()
	@Type(() => SlideContent)
	@IsOptional()
	content?: SlideContent;

	@IsInt()
	@Min(0)
	@IsOptional()
	order?: number;
}

class SlideOrderItem {
	@IsUUID()
	id: string;

	@IsInt()
	@Min(0)
	order: number;
}

export class ReorderSlidesDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SlideOrderItem)
	@ArrayMaxSize(200)
	slides: SlideOrderItem[];
}
