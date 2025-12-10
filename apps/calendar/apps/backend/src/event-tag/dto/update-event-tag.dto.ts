import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateEventTagDto {
	@IsString()
	@IsOptional()
	@MaxLength(100)
	name?: string;

	@IsString()
	@IsOptional()
	@MaxLength(7)
	color?: string;
}
