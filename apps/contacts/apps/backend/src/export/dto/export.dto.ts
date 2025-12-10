import { IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';

export type ExportFormat = 'vcard' | 'csv';

export class ExportRequestDto {
	@IsEnum(['vcard', 'csv'])
	format: ExportFormat;

	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	contactIds?: string[];

	@IsOptional()
	@IsUUID('4')
	tagId?: string;

	@IsOptional()
	includeFavorites?: boolean;

	@IsOptional()
	includeArchived?: boolean;
}
