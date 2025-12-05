import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateTimerDto {
	@IsOptional()
	@IsString()
	label?: string;

	@IsNumber()
	@Min(1)
	@Max(86400) // Max 24 hours
	durationSeconds!: number;

	@IsOptional()
	@IsString()
	sound?: string;
}

export class UpdateTimerDto {
	@IsOptional()
	@IsString()
	label?: string;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(86400)
	durationSeconds?: number;

	@IsOptional()
	@IsString()
	sound?: string;
}
