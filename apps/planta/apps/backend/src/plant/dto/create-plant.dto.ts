import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePlantDto {
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	scientificName?: string;

	@IsOptional()
	@IsString()
	commonName?: string;

	@IsOptional()
	@IsDateString()
	acquiredAt?: string;
}
