import { IsString, IsOptional, IsEnum, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PricingTier } from '../../config/pricing';

export class CreateApiKeyDto {
	@ApiProperty({
		description: 'Display name for the API key',
		example: 'Production API Key',
	})
	@IsString()
	name: string;

	@ApiPropertyOptional({
		description: 'Optional description for the API key',
		example: 'Used for production web application',
	})
	@IsString()
	@IsOptional()
	description?: string;

	@ApiPropertyOptional({
		description: 'Pricing tier (determines rate limits and credits)',
		enum: ['free', 'pro', 'enterprise'],
		default: 'free',
	})
	@IsString()
	@IsOptional()
	@IsEnum(['free', 'pro', 'enterprise'])
	tier?: PricingTier;

	@ApiPropertyOptional({
		description: 'List of allowed endpoints (null = all endpoints allowed)',
		example: ['search', 'tts'],
		type: [String],
	})
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	allowedEndpoints?: string[];

	@ApiPropertyOptional({
		description: 'IP whitelist for this key (null = all IPs allowed)',
		example: ['192.168.1.0/24', '10.0.0.1'],
		type: [String],
	})
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	allowedIps?: string[];

	@ApiPropertyOptional({
		description: 'Expiration date for the API key (ISO 8601)',
		example: '2025-12-31T23:59:59Z',
	})
	@IsDateString()
	@IsOptional()
	expiresAt?: string;

	@ApiPropertyOptional({
		description: 'Create a test key (sk_test_ prefix) instead of live key',
		default: false,
	})
	@IsBoolean()
	@IsOptional()
	isTest?: boolean;
}
