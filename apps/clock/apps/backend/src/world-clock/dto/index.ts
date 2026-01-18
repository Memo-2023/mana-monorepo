import { IsString, IsArray, IsUUID } from 'class-validator';

export class CreateWorldClockDto {
	@IsString()
	timezone!: string;

	@IsString()
	cityName!: string;
}

export class ReorderWorldClocksDto {
	@IsArray()
	@IsUUID('4', { each: true })
	ids!: string[];
}
