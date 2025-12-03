import { IsEnum, IsOptional, IsArray, ValidateNested, IsString, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ParsedContactDto {
	@IsOptional()
	@IsString()
	firstName?: string;

	@IsOptional()
	@IsString()
	lastName?: string;

	@IsOptional()
	@IsString()
	displayName?: string;

	@IsOptional()
	@IsString()
	nickname?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsString()
	mobile?: string;

	@IsOptional()
	@IsString()
	street?: string;

	@IsOptional()
	@IsString()
	city?: string;

	@IsOptional()
	@IsString()
	postalCode?: string;

	@IsOptional()
	@IsString()
	country?: string;

	@IsOptional()
	@IsString()
	company?: string;

	@IsOptional()
	@IsString()
	jobTitle?: string;

	@IsOptional()
	@IsString()
	department?: string;

	@IsOptional()
	@IsString()
	website?: string;

	@IsOptional()
	@IsString()
	birthday?: string;

	@IsOptional()
	@IsString()
	notes?: string;

	@IsOptional()
	@IsString()
	photoUrl?: string;
}

export type DuplicateAction = 'skip' | 'merge' | 'create';

export class DuplicateInfo {
	importIndex: number;
	existingContactId: string;
	existingContactName: string;
	matchField: 'email' | 'phone';
	matchValue: string;
}

export class ImportPreviewResponseDto {
	contacts: ParsedContactDto[];
	duplicates: DuplicateInfo[];
	totalParsed: number;
	validCount: number;
	invalidCount: number;
	errors: string[];
}

export class ExecuteImportDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ParsedContactDto)
	contacts: ParsedContactDto[];

	@IsEnum(['skip', 'merge', 'create'])
	duplicateAction: DuplicateAction;

	@IsOptional()
	@IsArray()
	skipIndices?: number[];
}

export class ImportResultDto {
	imported: number;
	skipped: number;
	merged: number;
	errors: ImportErrorDto[];
}

export class ImportErrorDto {
	index: number;
	contactName: string;
	error: string;
}
