import { IsString, IsOptional, IsNumber, MaxLength, Min, Max } from 'class-validator';

export class UpdateSettingsDto {
	@IsOptional()
	@IsString()
	@MaxLength(3)
	defaultCurrency?: string;

	@IsOptional()
	@IsString()
	@MaxLength(10)
	locale?: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	dateFormat?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(6)
	weekStartsOn?: number;
}
