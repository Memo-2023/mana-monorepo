import { IsArray, IsUUID } from 'class-validator';

export class ReorderEventTagGroupsDto {
	@IsArray()
	@IsUUID('4', { each: true })
	groupIds!: string[];
}
