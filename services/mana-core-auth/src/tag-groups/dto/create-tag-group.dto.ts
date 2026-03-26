import { IsString, IsOptional, IsInt, MaxLength, Matches } from 'class-validator';

export class CreateTagGroupDto {
	@IsString()
	@MaxLength(100)
	name: string;

	@IsOptional()
	@IsString()
	@MaxLength(7)
	@Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color (e.g., #3B82F6)' })
	color?: string;

	@IsOptional()
	@IsString()
	@MaxLength(50)
	icon?: string;

	@IsOptional()
	@IsInt()
	sortOrder?: number;
}
