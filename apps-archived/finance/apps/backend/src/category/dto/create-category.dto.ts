import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsBoolean,
	IsUUID,
	MaxLength,
	IsIn,
} from 'class-validator';

const CATEGORY_TYPES = ['income', 'expense'] as const;

export class CreateCategoryDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	name: string;

	@IsString()
	@IsIn(CATEGORY_TYPES)
	type: (typeof CATEGORY_TYPES)[number];

	@IsOptional()
	@IsUUID()
	parentId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	color?: string;

	@IsOptional()
	@IsString()
	@MaxLength(50)
	icon?: string;
}
