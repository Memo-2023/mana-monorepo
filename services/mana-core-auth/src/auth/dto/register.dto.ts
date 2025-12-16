import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
	@IsEmail()
	email: string;

	@IsString()
	@MinLength(8)
	@MaxLength(128)
	password: string;

	@IsString()
	@MinLength(2, { message: 'Name must be at least 2 characters' })
	@MaxLength(255)
	name: string;
}
