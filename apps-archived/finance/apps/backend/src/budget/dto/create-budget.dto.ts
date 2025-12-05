import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID, Min, Max } from 'class-validator';

export class CreateBudgetDto {
	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@IsNumber()
	@Min(1)
	@Max(12)
	month: number;

	@IsNumber()
	@Min(2000)
	@Max(2100)
	year: number;

	@IsNumber()
	@Min(0)
	amount: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(1)
	alertThreshold?: number;

	@IsOptional()
	@IsBoolean()
	rolloverEnabled?: boolean;
}
