import { IsString, IsOptional, IsBoolean, IsUUID, MaxLength, IsIn } from 'class-validator';

const CATEGORY_TYPES = ['income', 'expense'] as const;

export class UpdateCategoryDto {
	@IsOptional()
	@IsString()
	@MaxLength(100)
	name?: string;

	@IsOptional()
	@IsString()
	@IsIn(CATEGORY_TYPES)
	type?: (typeof CATEGORY_TYPES)[number];

	@IsOptional()
	@IsUUID()
	parentId?: string | null;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	color?: string;

	@IsOptional()
	@IsString()
	@MaxLength(50)
	icon?: string;

	@IsOptional()
	@IsBoolean()
	isArchived?: boolean;
}
