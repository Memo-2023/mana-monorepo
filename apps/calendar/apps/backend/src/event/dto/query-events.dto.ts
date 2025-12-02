import { IsOptional, IsDateString, IsArray, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryEventsDto {
	@IsOptional()
	@IsDateString()
	startDate?: string;

	@IsOptional()
	@IsDateString()
	endDate?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
	calendarIds?: string[];

	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true' || value === true)
	includeCancelled?: boolean;

	@IsOptional()
	@IsString()
	search?: string;
}
