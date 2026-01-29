import { IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class UsageQueryDto {
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsInt()
	@Min(1)
	@Max(365)
	days?: number = 30;

	@IsOptional()
	@IsDateString()
	startDate?: string;

	@IsOptional()
	@IsDateString()
	endDate?: string;

	@IsOptional()
	@IsString()
	endpoint?: string;
}
