import { IsString, IsInt, IsPositive, IsOptional, IsObject } from 'class-validator';

export class UseCreditsDto {
	@IsInt()
	@IsPositive()
	amount: number;

	@IsString()
	appId: string;

	@IsString()
	description: string;

	@IsString()
	@IsOptional()
	idempotencyKey?: string;

	@IsObject()
	@IsOptional()
	metadata?: Record<string, any>;
}
