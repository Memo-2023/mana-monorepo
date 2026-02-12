import { IsString, IsNotEmpty, MaxLength, MinLength, IsOptional, IsIn } from 'class-validator';
import type { FigureLanguage } from '@figgos/shared';

export class CreateFigureDto {
	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	@MaxLength(200)
	name!: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	@MaxLength(2000)
	description!: string;

	@IsOptional()
	@IsString()
	@IsIn(['en', 'de'])
	language?: FigureLanguage = 'en';

	@IsOptional()
	@IsString()
	faceImage?: string;
}
