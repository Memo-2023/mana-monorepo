import { IsString, IsOptional, IsBoolean, MaxLength, IsIn } from 'class-validator';
import type { KanbanTaskStatus } from '../../db/schema/kanban-columns.schema';

export class CreateColumnDto {
	@IsString()
	@MaxLength(100)
	name: string;

	@IsOptional()
	@IsString()
	@MaxLength(7)
	color?: string;

	@IsOptional()
	@IsString()
	projectId?: string;

	@IsOptional()
	@IsBoolean()
	isDefault?: boolean;

	@IsOptional()
	@IsIn(['pending', 'in_progress', 'completed', 'cancelled'])
	defaultStatus?: KanbanTaskStatus;

	@IsOptional()
	@IsBoolean()
	autoComplete?: boolean;
}
