import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateCollectionDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	color?: string;

	@IsOptional()
	@IsString()
	icon?: string;

	@IsOptional()
	@IsBoolean()
	isDefault?: boolean;

	@IsOptional()
	@IsNumber()
	sortOrder?: number;
}
