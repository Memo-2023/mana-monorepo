import { IsArray, IsUUID } from 'class-validator';

export class ReorderProjectsDto {
	@IsArray()
	@IsUUID('4', { each: true })
	projectIds: string[];
}
