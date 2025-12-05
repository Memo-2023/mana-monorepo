import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateLocationDto {
	@IsString()
	@MaxLength(100)
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsUUID()
	parentLocationId?: string;
}

export class UpdateLocationDto {
	@IsOptional()
	@IsString()
	@MaxLength(100)
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsUUID()
	parentLocationId?: string;
}
