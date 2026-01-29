import { IsString, IsOptional, IsBoolean, IsArray, IsDateString } from 'class-validator';

export class UpdateApiKeyDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	allowedEndpoints?: string[];

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	allowedIps?: string[];

	@IsBoolean()
	@IsOptional()
	active?: boolean;

	@IsDateString()
	@IsOptional()
	expiresAt?: string;
}
