import {
	IsString,
	IsOptional,
	IsUUID,
	IsEnum,
	IsBoolean,
	IsNumber,
	IsArray,
	IsObject,
	MaxLength,
	IsDateString,
} from 'class-validator';
import type { TaskPriority, TaskStatus, Subtask, TaskMetadata } from '../../db/schema/tasks.schema';

export class UpdateTaskDto {
	@IsOptional()
	@IsString()
	@MaxLength(500)
	title?: string;

	@IsOptional()
	@IsString()
	description?: string | null;

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
	@IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
	status?: TaskStatus;

	@IsOptional()
	@IsBoolean()
	isCompleted?: boolean;

	@IsOptional()
	@IsNumber()
	order?: number;

	@IsOptional()
	@IsString()
	recurrenceRule?: string | null;

	@IsOptional()
	@IsDateString()
	recurrenceEndDate?: string | null;

	@IsOptional()
	@IsArray()
	subtasks?: Subtask[] | null;

	@IsOptional()
	@IsObject()
	metadata?: TaskMetadata | null;
}
