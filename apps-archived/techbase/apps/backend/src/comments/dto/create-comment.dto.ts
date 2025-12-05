import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
	@IsString()
	@IsNotEmpty()
	softwareId: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	@MaxLength(100)
	userName: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(10)
	@MaxLength(2000)
	comment: string;
}
