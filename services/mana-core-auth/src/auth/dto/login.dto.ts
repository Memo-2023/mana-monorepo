import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
	@ApiProperty({
		description: 'User email address',
		example: 'user@example.com',
	})
	@IsEmail()
	email: string;

	@ApiProperty({
		description: 'User password',
		example: 'SecurePassword123!',
	})
	@IsString()
	password: string;

	@ApiPropertyOptional({
		description: 'Unique device identifier for session tracking',
		example: 'device-uuid-123',
	})
	@IsString()
	@IsOptional()
	deviceId?: string;

	@ApiPropertyOptional({
		description: 'Human-readable device name',
		example: 'iPhone 15 Pro',
	})
	@IsString()
	@IsOptional()
	deviceName?: string;
}
