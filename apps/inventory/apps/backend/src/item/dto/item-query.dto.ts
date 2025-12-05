import { IsOptional, IsString, IsUUID, IsBoolean, IsIn, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ItemQueryDto {
	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@IsOptional()
	@IsUUID()
	locationId?: string;

	@IsOptional()
	@IsIn(['new', 'like_new', 'good', 'fair', 'poor'])
	condition?: string;

	@IsOptional()
	@Transform(({ value }) => value === 'true')
	@IsBoolean()
	isFavorite?: boolean;

	@IsOptional()
	@Transform(({ value }) => value === 'true')
	@IsBoolean()
	isArchived?: boolean;

	@IsOptional()
	@IsIn(['name', 'createdAt', 'updatedAt', 'purchaseDate', 'purchasePrice', 'currentValue'])
	sortBy?: string;

	@IsOptional()
	@IsIn(['asc', 'desc'])
	sortOrder?: 'asc' | 'desc';

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	page?: number;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	limit?: number;
}
