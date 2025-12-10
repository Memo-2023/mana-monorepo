import {
	IsString,
	IsOptional,
	IsBoolean,
	IsObject,
	IsDateString,
	IsUUID,
	IsIn,
	IsArray,
	MaxLength,
} from 'class-validator';
import type { EventMetadata } from '../../db/schema/events.schema';

export class UpdateEventDto {
	@IsOptional()
	@IsUUID()
	calendarId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	title?: string;

	@IsOptional()
	@IsString()
	description?: string | null;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	location?: string | null;

	@IsOptional()
	@IsDateString()
	startTime?: string;

	@IsOptional()
	@IsDateString()
	endTime?: string;

	@IsOptional()
	@IsBoolean()
	isAllDay?: boolean;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	timezone?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	recurrenceRule?: string | null;

	@IsOptional()
	@IsDateString()
	recurrenceEndDate?: string | null;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	recurrenceExceptions?: string[];

	@IsOptional()
	@IsString()
	@MaxLength(7)
	color?: string | null;

	@IsOptional()
	@IsIn(['confirmed', 'tentative', 'cancelled'])
	status?: 'confirmed' | 'tentative' | 'cancelled';

	@IsOptional()
	@IsObject()
	metadata?: EventMetadata;

	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	tagIds?: string[];
}
