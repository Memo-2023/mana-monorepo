import { IsString, IsOptional, IsBoolean, IsObject, MaxLength } from 'class-validator';
import type { CalendarSettings } from '../../db/schema/calendars.schema';

export class UpdateCalendarDto {
	@IsOptional()
	@IsString()
	@MaxLength(255)
	name?: string;

	@IsOptional()
	@IsString()
	description?: string | null;

	@IsOptional()
	@IsString()
	@MaxLength(7)
	color?: string;

	@IsOptional()
	@IsBoolean()
	isDefault?: boolean;

	@IsOptional()
	@IsBoolean()
	isVisible?: boolean;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	timezone?: string;

	@IsOptional()
	@IsObject()
	settings?: CalendarSettings;
}
