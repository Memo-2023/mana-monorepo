import { IsString, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { PricingTier } from '../../config/pricing';

export class CreateApiKeyDto {
	@IsString()
	name: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsString()
	@IsOptional()
	@IsEnum(['free', 'pro', 'enterprise'])
	tier?: PricingTier;

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	allowedEndpoints?: string[];

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	allowedIps?: string[];

	@IsDateString()
	@IsOptional()
	expiresAt?: string;

	@IsOptional()
	isTest?: boolean;
}
