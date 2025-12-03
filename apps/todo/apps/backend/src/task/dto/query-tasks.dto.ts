import {
	IsOptional,
	IsUUID,
	IsEnum,
	IsBoolean,
	IsString,
	IsNumber,
	IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import type { TaskPriority, TaskStatus } from '../../db/schema/tasks.schema';

export class QueryTasksDto {
	@IsOptional()
	@IsUUID()
	projectId?: string;

	@IsOptional()
	@IsUUID()
	labelId?: string;

	@IsOptional()
	@IsEnum(['low', 'medium', 'high', 'urgent'])
	priority?: TaskPriority;

	@IsOptional()
	@IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
	status?: TaskStatus;

	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true)
	@IsBoolean()
	isCompleted?: boolean;

	@IsOptional()
	@IsDateString()
	dueDateFrom?: string;

	@IsOptional()
	@IsDateString()
	dueDateTo?: string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsEnum(['dueDate', 'priority', 'createdAt', 'order'])
	sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'order';

	@IsOptional()
	@IsEnum(['asc', 'desc'])
	sortOrder?: 'asc' | 'desc';

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber()
	limit?: number;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber()
	offset?: number;
}
