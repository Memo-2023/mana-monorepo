import {
	IsString,
	IsOptional,
	IsNumber,
	IsBoolean,
	IsUUID,
	IsDateString,
	IsIn,
	Min,
} from 'class-validator';
import type { ItemCondition } from '@inventory/shared';

export class UpdateItemDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	sku?: string;

	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@IsOptional()
	@IsUUID()
	locationId?: string;

	@IsOptional()
	@IsDateString()
	purchaseDate?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	purchasePrice?: number;

	@IsOptional()
	@IsString()
	currency?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	currentValue?: number;

	@IsOptional()
	@IsIn(['new', 'like_new', 'good', 'fair', 'poor'])
	condition?: ItemCondition;

	@IsOptional()
	@IsDateString()
	warrantyExpires?: string;

	@IsOptional()
	@IsString()
	warrantyNotes?: string;

	@IsOptional()
	@IsString()
	notes?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	quantity?: number;

	@IsOptional()
	@IsBoolean()
	isFavorite?: boolean;
}
