import { IsString, IsOptional, IsIn, MinLength, IsNumber } from 'class-validator';

export class GenerateGameDto {
	@IsString()
	@MinLength(10, { message: 'Bitte gib eine Spielbeschreibung mit mindestens 10 Zeichen ein' })
	description: string;

	@IsOptional()
	@IsIn(['create', 'iterate'])
	mode?: 'create' | 'iterate' = 'create';

	@IsOptional()
	@IsString()
	originalPrompt?: string;

	@IsOptional()
	@IsString()
	currentCode?: string;

	@IsOptional()
	@IsNumber()
	iterationCount?: number = 0;

	@IsOptional()
	@IsString()
	model?: string = 'gemini-2.0-flash';
}

export class GenerateGameResponseDto {
	success: boolean;
	html: string;
	metadata: {
		description: string;
		generatedAt: string;
	};
}
