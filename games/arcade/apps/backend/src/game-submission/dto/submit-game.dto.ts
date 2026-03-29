import { IsString, IsArray, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class AuthorDto {
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	email?: string;

	@IsOptional()
	@IsString()
	github?: string;
}

class FileDto {
	@IsString()
	name: string;

	@IsString()
	content: string;
}

class FilesDto {
	@ValidateNested()
	@Type(() => FileDto)
	html: FileDto;

	@ValidateNested()
	@Type(() => FileDto)
	screenshot: FileDto;
}

export class SubmitGameDto {
	@IsString()
	title: string;

	@IsString()
	description: string;

	@IsString()
	controls: string;

	@IsIn(['Einfach', 'Mittel', 'Schwer'])
	difficulty: string;

	@IsIn(['Minimal', 'Einfach', 'Mittel', 'Komplex'])
	complexity: string;

	@IsArray()
	@IsString({ each: true })
	tags: string[];

	@ValidateNested()
	@Type(() => AuthorDto)
	author: AuthorDto;

	@ValidateNested()
	@Type(() => FilesDto)
	files: FilesDto;

	@IsString()
	submittedAt: string;
}

export class SubmitGameResponseDto {
	success: boolean;
	message: string;
	prUrl: string;
	prNumber: number;
}
