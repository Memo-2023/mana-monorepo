import { IsString, IsArray } from 'class-validator';

export class ReorderBoardsDto {
	@IsArray()
	@IsString({ each: true })
	boardIds: string[];
}
