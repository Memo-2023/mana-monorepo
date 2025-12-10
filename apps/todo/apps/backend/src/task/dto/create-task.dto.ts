import {
	IsString,
	IsOptional,
	IsUUID,
	IsEnum,
	IsArray,
	MaxLength,
	MinLength,
	IsDateString,
	IsNotEmpty,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { TaskPriority } from '../../db/schema/tasks.schema';
import { CreateSubtaskDto } from './subtask.dto';
import { TaskMetadataDto } from './metadata.dto';

export class CreateTaskDto {
	@IsString()
	@IsNotEmpty({ message: 'Titel darf nicht leer sein' })
	@MinLength(1, { message: 'Titel muss mindestens 1 Zeichen haben' })
	@MaxLength(500, { message: 'Titel darf maximal 500 Zeichen haben' })
	title: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsUUID()
	projectId?: string | null;

	@IsOptional()
	@IsUUID()
	parentTaskId?: string | null;

	@IsOptional()
	@IsDateString()
	dueDate?: string | null;

	@IsOptional()
	@IsString()
	@MaxLength(5)
	dueTime?: string | null;

	@IsOptional()
	@IsDateString()
	startDate?: string | null;

	@IsOptional()
	@IsEnum(['low', 'medium', 'high', 'urgent'])
	priority?: TaskPriority;

	@IsOptional()
	@IsString()
	recurrenceRule?: string | null;

	@IsOptional()
	@IsDateString()
	recurrenceEndDate?: string | null;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateSubtaskDto)
	subtasks?: CreateSubtaskDto[];

	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	labelIds?: string[];

	@IsOptional()
	@ValidateNested()
	@Type(() => TaskMetadataDto)
	metadata?: TaskMetadataDto;
}
