import { IsArray, IsString, IsOptional } from 'class-validator';

export class ReorderTasksDto {
	@IsArray()
	@IsString({ each: true })
	taskIds: string[];

	@IsOptional()
	@IsString()
	projectId?: string | null;
}
