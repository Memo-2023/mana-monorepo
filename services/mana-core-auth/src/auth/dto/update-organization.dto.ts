import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an organization
 *
 * All fields are optional - only provided fields will be updated.
 */
export class UpdateOrganizationDto {
	@ApiPropertyOptional({
		description: 'New name for the organization',
		minLength: 2,
		maxLength: 255,
		example: 'Acme Corporation',
	})
	@IsString()
	@IsOptional()
	@MinLength(2)
	@MaxLength(255)
	name?: string;

	@ApiPropertyOptional({
		description: 'URL to organization logo',
		maxLength: 500,
		example: 'https://example.com/logo.png',
	})
	@IsString()
	@IsOptional()
	@MaxLength(500)
	logo?: string;

	@ApiPropertyOptional({
		description: 'Additional metadata for the organization',
		example: { industry: 'Technology', size: 'Enterprise' },
	})
	@IsOptional()
	metadata?: Record<string, unknown>;
}
