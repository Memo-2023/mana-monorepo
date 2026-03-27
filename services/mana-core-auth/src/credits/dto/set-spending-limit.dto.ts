import { IsInt, IsOptional, Min } from 'class-validator';

export class SetSpendingLimitDto {
	@IsOptional()
	@IsInt()
	@Min(0)
	dailyLimit?: number | null;

	@IsOptional()
	@IsInt()
	@Min(0)
	monthlyLimit?: number | null;
}
