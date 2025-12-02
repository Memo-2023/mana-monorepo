import { IsUUID, IsInt, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateReminderDto {
	@IsUUID()
	eventId: string;

	@IsInt()
	@Min(0)
	@Max(10080) // Max 1 week in minutes
	minutesBefore: number;

	@IsOptional()
	@IsBoolean()
	notifyPush?: boolean;

	@IsOptional()
	@IsBoolean()
	notifyEmail?: boolean;
}
