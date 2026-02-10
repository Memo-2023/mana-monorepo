import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateFigureDto {
	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	@MaxLength(200)
	name!: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	@MaxLength(2000)
	description!: string;
}
