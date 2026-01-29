import {
	IsString,
	IsOptional,
	IsBoolean,
	IsArray,
	IsDateString,
	IsInt,
	IsEnum,
	Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUpdateKeyDto {
	@ApiPropertyOptional({
		description: 'Update the display name',
		example: 'Updated API Key Name',
	})
	@IsString()
	@IsOptional()
	name?: string;

	@ApiPropertyOptional({
		description: 'Update the description',
		example: 'Updated description',
	})
	@IsString()
	@IsOptional()
	description?: string;

	@ApiPropertyOptional({
		description: 'Change the pricing tier',
		enum: ['free', 'pro', 'enterprise'],
	})
	@IsString()
	@IsOptional()
	@IsEnum(['free', 'pro', 'enterprise'])
	tier?: 'free' | 'pro' | 'enterprise';

	@ApiPropertyOptional({
		description: 'Custom rate limit (requests per minute)',
		example: 100,
	})
	@IsInt()
	@IsOptional()
	@Min(1)
	rateLimit?: number;

	@ApiPropertyOptional({
		description: 'Custom monthly credits limit',
		example: 5000,
	})
	@IsInt()
	@IsOptional()
	@Min(0)
	monthlyCredits?: number;

	@ApiPropertyOptional({
		description: 'Reset credits used to 0',
		example: true,
	})
	@IsBoolean()
	@IsOptional()
	resetCredits?: boolean;

	@ApiPropertyOptional({
		description: 'Update allowed endpoints',
		example: ['search', 'stt', 'tts'],
		type: [String],
	})
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	allowedEndpoints?: string[];

	@ApiPropertyOptional({
		description: 'Update IP whitelist',
		example: ['192.168.1.0/24'],
		type: [String],
	})
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	allowedIps?: string[];

	@ApiPropertyOptional({
		description: 'Enable or disable the API key',
		example: true,
	})
	@IsBoolean()
	@IsOptional()
	active?: boolean;

	@ApiPropertyOptional({
		description: 'Update expiration date (ISO 8601)',
		example: '2025-12-31T23:59:59Z',
	})
	@IsDateString()
	@IsOptional()
	expiresAt?: string;
}
