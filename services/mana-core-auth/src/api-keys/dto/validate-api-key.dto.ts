import { IsString, IsOptional } from 'class-validator';

export class ValidateApiKeyDto {
	@IsString()
	apiKey: string;

	@IsOptional()
	@IsString()
	scope?: string;
}

export class ValidateApiKeyResponseDto {
	valid: boolean;
	userId?: string;
	scopes?: string[];
	rateLimit?: {
		requests: number;
		window: number;
	};
	error?: string;
}
