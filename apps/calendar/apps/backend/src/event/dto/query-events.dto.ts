import {
	IsOptional,
	IsDateString,
	IsArray,
	IsBoolean,
	IsString,
	IsInt,
	Min,
	Max,
	MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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
	@MaxLength(500)
	search?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(500)
	limit?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	offset?: number;
}
