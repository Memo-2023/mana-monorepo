import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
	@ApiProperty({ description: 'Current password', example: 'currentPassword123' })
	@IsString()
	@MinLength(1)
	currentPassword: string;

	@ApiProperty({ description: 'New password (min 8 characters)', example: 'newSecurePassword456' })
	@IsString()
	@MinLength(8)
	@MaxLength(128)
	newPassword: string;
}
