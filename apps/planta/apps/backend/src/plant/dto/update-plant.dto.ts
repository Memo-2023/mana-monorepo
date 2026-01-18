import { IsString, IsOptional, IsBoolean, IsNumber, IsIn } from 'class-validator';

export class UpdatePlantDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	scientificName?: string;

	@IsOptional()
	@IsString()
	commonName?: string;

	@IsOptional()
	@IsString()
	careNotes?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsIn(['low', 'medium', 'bright', 'direct'])
	lightRequirements?: string;

	@IsOptional()
	@IsNumber()
	wateringFrequencyDays?: number;

	@IsOptional()
	@IsIn(['low', 'medium', 'high'])
	humidity?: string;
}
