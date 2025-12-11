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

export class CreateEventDto {
	@IsOptional()
	@IsUUID()
	calendarId?: string;

	@IsString()
	@MaxLength(500)
	title: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	location?: string;

	@IsDateString()
	startTime: string;

	@IsDateString()
	endTime: string;

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
	recurrenceRule?: string;

	@IsOptional()
	@IsDateString()
	recurrenceEndDate?: string;

	@IsOptional()
	@IsString()
	@MaxLength(7)
	color?: string;

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
