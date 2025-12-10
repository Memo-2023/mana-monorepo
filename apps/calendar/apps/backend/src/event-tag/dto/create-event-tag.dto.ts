import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateEventTagDto {
	@IsString()
	@MaxLength(100)
	name!: string;

	@IsString()
	@IsOptional()
	@MaxLength(7)
	color?: string;
}
