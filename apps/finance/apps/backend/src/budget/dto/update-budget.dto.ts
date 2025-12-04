import { IsOptional, IsBoolean, IsNumber, IsUUID, Min, Max } from 'class-validator';

export class UpdateBudgetDto {
	@IsOptional()
	@IsUUID()
	categoryId?: string | null;

	@IsOptional()
	@IsNumber()
	@Min(0)
	amount?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(1)
	alertThreshold?: number;

	@IsOptional()
	@IsBoolean()
	rolloverEnabled?: boolean;
}
