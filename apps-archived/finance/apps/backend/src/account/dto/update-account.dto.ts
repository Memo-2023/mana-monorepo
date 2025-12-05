import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength, IsIn } from 'class-validator';

const ACCOUNT_TYPES = ['checking', 'savings', 'credit_card', 'cash', 'investment', 'loan'] as const;

export class UpdateAccountDto {
	@IsOptional()
	@IsString()
	@MaxLength(100)
	name?: string;

	@IsOptional()
	@IsString()
	@IsIn(ACCOUNT_TYPES)
	type?: (typeof ACCOUNT_TYPES)[number];

	@IsOptional()
	@IsNumber()
	balance?: number;

	@IsOptional()
	@IsString()
	@MaxLength(3)
	currency?: string;

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
	includeInTotal?: boolean;

	@IsOptional()
	@IsBoolean()
	isArchived?: boolean;

	@IsOptional()
	@IsNumber()
	order?: number;
}
