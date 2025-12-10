import {
	IsString,
	IsOptional,
	IsNumber,
	IsArray,
	IsUUID,
	IsEnum,
	Min,
	Max,
	MaxLength,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EffectiveDurationDto {
	@IsNumber()
	@Min(1, { message: 'Dauer muss mindestens 1 sein' })
	@Max(9999, { message: 'Dauer darf maximal 9999 sein' })
	value: number;

	@IsEnum(['minutes', 'hours', 'days'], { message: 'Ungültige Zeiteinheit' })
	unit: 'minutes' | 'hours' | 'days';
}

export class TaskMetadataDto {
	@IsOptional()
	@IsString()
	@MaxLength(10000, { message: 'Notizen dürfen maximal 10000 Zeichen haben' })
	notes?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@MaxLength(500, { each: true })
	attachments?: string[];

	@IsOptional()
	@IsUUID()
	linkedCalendarEventId?: string | null;

	@IsOptional()
	@IsNumber()
	@IsEnum([1, 2, 3, 5, 8, 13, 21], {
		message: 'Storypoints müssen Fibonacci-Zahlen sein (1,2,3,5,8,13,21)',
	})
	storyPoints?: number | null;

	@IsOptional()
	@ValidateNested()
	@Type(() => EffectiveDurationDto)
	effectiveDuration?: EffectiveDurationDto | null;

	@IsOptional()
	@IsNumber()
	@Min(1, { message: 'Spaß-Faktor muss mindestens 1 sein' })
	@Max(10, { message: 'Spaß-Faktor darf maximal 10 sein' })
	funRating?: number | null;
}
