import { IsInt, IsPositive, IsOptional, IsString } from 'class-validator';

export class FundGuildPoolDto {
	@IsInt()
	@IsPositive()
	amount: number;

	@IsString()
	@IsOptional()
	idempotencyKey?: string;
}
