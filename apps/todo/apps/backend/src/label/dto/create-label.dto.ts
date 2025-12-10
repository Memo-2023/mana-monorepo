import { IsString, IsOptional, MaxLength, MinLength, IsNotEmpty } from 'class-validator';

export class CreateLabelDto {
	@IsString()
	@IsNotEmpty({ message: 'Name darf nicht leer sein' })
	@MinLength(1, { message: 'Name muss mindestens 1 Zeichen haben' })
	@MaxLength(100, { message: 'Name darf maximal 100 Zeichen haben' })
	name: string;

	@IsOptional()
	@IsString()
	@MaxLength(7)
	color?: string;
}
