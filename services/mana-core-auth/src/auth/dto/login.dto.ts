import { IsEmail, IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class LoginDto {
	@IsEmail()
	email: string;

	@IsString()
	@MinLength(12) // Matches Better Auth config (minPasswordLength: 12)
	password: string;

	@IsString()
	@IsOptional()
	deviceId?: string;

	@IsString()
	@IsOptional()
	deviceName?: string;

	@IsBoolean()
	@IsOptional()
	rememberMe?: boolean;

	@IsString()
	@IsOptional()
	ipAddress?: string;

	@IsString()
	@IsOptional()
	userAgent?: string;
}
