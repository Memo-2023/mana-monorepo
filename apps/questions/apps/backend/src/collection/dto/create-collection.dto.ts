import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCollectionDto {
	@IsString()
	name: string;

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
}
