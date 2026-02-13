import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteAccountDto {
	@ApiProperty({
		description: 'Current password to confirm account deletion',
		example: 'myPassword123',
	})
	@IsString()
	@MinLength(1)
	password: string;

	@ApiPropertyOptional({
		description: 'Optional reason for leaving',
		example: 'I found a better service',
	})
	@IsOptional()
	@IsString()
	reason?: string;
}
