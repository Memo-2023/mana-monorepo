import { IsString, IsNumber, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class AddXpDto {
	@IsNumber()
	@Min(1)
	@Max(10000)
	xp: number;

	@IsString()
	@MaxLength(500)
	description: string;

	@IsOptional()
	@IsNumber()
	@Min(1)
	duration?: number; // in minutes
}
