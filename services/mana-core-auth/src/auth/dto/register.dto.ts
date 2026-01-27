import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsUrl } from 'class-validator';

export class RegisterDto {
	@IsEmail()
	email: string;

	@IsString()
	@MinLength(8)
	@MaxLength(128)
	password: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	name?: string;

	@IsString()
	@IsOptional()
	@IsUrl({ require_tld: false }) // Allow localhost URLs for development
	@MaxLength(255)
	sourceAppUrl?: string;
}
