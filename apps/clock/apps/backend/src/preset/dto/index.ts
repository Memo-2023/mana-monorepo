import { IsString, IsOptional, IsNumber, Min, Max, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PresetSettingsDto {
	@IsOptional()
	@IsNumber()
	@Min(1)
	workDuration?: number;

	@IsOptional()
	@IsNumber()
	@Min(1)
	breakDuration?: number;

	@IsOptional()
	@IsNumber()
	@Min(1)
	longBreakDuration?: number;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(10)
	sessionsBeforeLongBreak?: number;

	@IsOptional()
	@IsString()
	sound?: string;
}

export class CreatePresetDto {
	@IsString()
	@IsIn(['timer', 'pomodoro'])
	type!: string;

	@IsString()
	name!: string;

	@IsNumber()
	@Min(1)
	@Max(86400)
	durationSeconds!: number;

	@IsOptional()
	@ValidateNested()
	@Type(() => PresetSettingsDto)
	settings?: PresetSettingsDto;
}

export class UpdatePresetDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(86400)
	durationSeconds?: number;

	@IsOptional()
	@ValidateNested()
	@Type(() => PresetSettingsDto)
	settings?: PresetSettingsDto;
}
