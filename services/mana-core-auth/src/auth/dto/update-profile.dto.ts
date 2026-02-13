import { IsString, IsOptional, IsEmail, MinLength, MaxLength, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
	@ApiPropertyOptional({ description: 'New display name', example: 'Max Mustermann' })
	@IsOptional()
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	name?: string;

	@ApiPropertyOptional({
		description: 'Profile image URL',
		example: 'https://example.com/avatar.jpg',
	})
	@IsOptional()
	@IsUrl()
	image?: string;
}
