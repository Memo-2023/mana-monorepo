import { IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UsageQueryDto {
	@ApiPropertyOptional({
		description: 'Number of days to query (1-365)',
		minimum: 1,
		maximum: 365,
		default: 30,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsInt()
	@Min(1)
	@Max(365)
	days?: number = 30;

	@ApiPropertyOptional({
		description: 'Start date for custom range (ISO 8601)',
		example: '2025-01-01',
	})
	@IsOptional()
	@IsDateString()
	startDate?: string;

	@ApiPropertyOptional({
		description: 'End date for custom range (ISO 8601)',
		example: '2025-01-31',
	})
	@IsOptional()
	@IsDateString()
	endDate?: string;

	@ApiPropertyOptional({
		description: 'Filter by endpoint',
		example: 'search',
	})
	@IsOptional()
	@IsString()
	endpoint?: string;
}
