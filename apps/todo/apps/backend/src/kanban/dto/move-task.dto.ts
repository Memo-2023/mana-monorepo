import { IsString, IsNumber, IsOptional } from 'class-validator';

export class MoveTaskToColumnDto {
	@IsString()
	columnId: string;

	@IsOptional()
	@IsNumber()
	order?: number;
}

export class ReorderTasksDto {
	@IsString()
	columnId: string;

	@IsString({ each: true })
	taskIds: string[];
}
