import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateSequenceDto {
	@IsString()
	name: string;

	@IsArray()
	@IsString({ each: true })
	moodIds: string[];

	@IsNumber()
	@IsOptional()
	duration?: number;
}

export class UpdateSequenceDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	moodIds?: string[];

	@IsNumber()
	@IsOptional()
	duration?: number;
}
