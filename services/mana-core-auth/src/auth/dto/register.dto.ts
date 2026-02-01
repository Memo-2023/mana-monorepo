import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
	@ApiProperty({
		description: 'User email address',
		example: 'user@example.com',
	})
	@IsEmail()
	email: string;

	@ApiProperty({
		description: 'User password (min 8 characters)',
		example: 'SecurePassword123!',
		minLength: 8,
		maxLength: 128,
	})
	@IsString()
	@MinLength(8)
	@MaxLength(128)
	password: string;

	@ApiPropertyOptional({
		description: 'User display name',
		example: 'John Doe',
		maxLength: 255,
	})
	@IsString()
	@IsOptional()
	@MaxLength(255)
	name?: string;

	@ApiPropertyOptional({
		description: 'URL of the source app for redirect after registration',
		example: 'https://app.example.com',
		maxLength: 255,
	})
	@IsString()
	@IsOptional()
	@IsUrl({ require_tld: false }) // Allow localhost URLs for development
	@MaxLength(255)
	sourceAppUrl?: string;
}
