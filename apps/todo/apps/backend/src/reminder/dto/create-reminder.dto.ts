import { IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import type { ReminderType } from '../../db/schema/reminders.schema';

export class CreateReminderDto {
	@IsNumber()
	@Min(0)
	minutesBefore: number;

	@IsOptional()
	@IsEnum(['push', 'email', 'both'])
	type?: ReminderType;
}
