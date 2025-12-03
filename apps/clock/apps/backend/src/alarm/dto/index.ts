import {
	IsString,
	IsOptional,
	IsBoolean,
	IsArray,
	IsNumber,
	Min,
	Max,
	Matches,
} from 'class-validator';

export class CreateAlarmDto {
	@IsOptional()
	@IsString()
	label?: string;

	@IsString()
	@Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
		message: 'time must be in HH:MM:SS format',
	})
	time!: string;

	@IsOptional()
	@IsBoolean()
	enabled?: boolean;

	@IsOptional()
	@IsArray()
	@IsNumber({}, { each: true })
	@Min(0, { each: true })
	@Max(6, { each: true })
	repeatDays?: number[];

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(60)
	snoozeMinutes?: number;

	@IsOptional()
	@IsString()
	sound?: string;

	@IsOptional()
	@IsBoolean()
	vibrate?: boolean;
}

export class UpdateAlarmDto {
	@IsOptional()
	@IsString()
	label?: string;

	@IsOptional()
	@IsString()
	@Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
		message: 'time must be in HH:MM:SS format',
	})
	time?: string;

	@IsOptional()
	@IsBoolean()
	enabled?: boolean;

	@IsOptional()
	@IsArray()
	@IsNumber({}, { each: true })
	@Min(0, { each: true })
	@Max(6, { each: true })
	repeatDays?: number[];

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(60)
	snoozeMinutes?: number;

	@IsOptional()
	@IsString()
	sound?: string;

	@IsOptional()
	@IsBoolean()
	vibrate?: boolean;
}
