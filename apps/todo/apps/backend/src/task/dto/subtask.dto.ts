import {
	IsString,
	IsBoolean,
	IsOptional,
	IsNumber,
	MinLength,
	MaxLength,
	Min,
	IsDateString,
} from 'class-validator';

export class SubtaskDto {
	@IsOptional()
	@IsString()
	id?: string;

	@IsString()
	@MinLength(1, { message: 'Subtask-Titel darf nicht leer sein' })
	@MaxLength(500, { message: 'Subtask-Titel darf maximal 500 Zeichen haben' })
	title: string;

	@IsBoolean()
	isCompleted: boolean;

	@IsOptional()
	@IsDateString()
	completedAt?: string | null;

	@IsNumber()
	@Min(0)
	order: number;
}

export class CreateSubtaskDto {
	@IsString()
	@MinLength(1, { message: 'Subtask-Titel darf nicht leer sein' })
	@MaxLength(500, { message: 'Subtask-Titel darf maximal 500 Zeichen haben' })
	title: string;

	@IsOptional()
	@IsBoolean()
	isCompleted?: boolean;

	@IsOptional()
	@IsNumber()
	@Min(0)
	order?: number;
}
