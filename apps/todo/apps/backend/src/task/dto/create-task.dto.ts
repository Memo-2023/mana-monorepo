import {
	IsString,
	IsOptional,
	IsUUID,
	IsEnum,
	IsArray,
	IsObject,
	MaxLength,
	IsDateString,
} from 'class-validator';
import type { TaskPriority, Subtask, TaskMetadata } from '../../db/schema/tasks.schema';

export class CreateTaskDto {
	@IsString()
	@MaxLength(500)
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
	subtasks?: Omit<Subtask, 'id'>[];

	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	labelIds?: string[];

	@IsOptional()
	@IsObject()
	metadata?: TaskMetadata;
}
