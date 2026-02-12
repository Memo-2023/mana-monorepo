import { IsString, IsOptional, MaxLength, IsArray, IsInt, Min, Max } from 'class-validator';

export class CreateApiKeyDto {
	@IsString()
	@MaxLength(100)
	name: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	scopes?: string[];

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(1000)
	rateLimitRequests?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(3600)
	rateLimitWindow?: number;
}
