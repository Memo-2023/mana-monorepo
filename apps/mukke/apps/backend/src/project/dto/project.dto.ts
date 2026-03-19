import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateProjectDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	title!: string;

	@IsString()
	@IsOptional()
	@MaxLength(2000)
	description?: string;
}

export class UpdateProjectDto {
	@IsString()
	@IsOptional()
	@MaxLength(255)
	title?: string;

	@IsString()
	@IsOptional()
	@MaxLength(2000)
	description?: string;
}
